import 'server-only'
import { pool } from '@/lib/db'
import { drainTime } from '../arcade/server'
import { RecordError } from '../errors'
import { type Queryable, run, txAs } from '../fundacao-db'
import { consumeItem, creditMinutes, grantItem, itemBalance } from '../inventario-server'
import { destinoDoKarma } from '../progresso'
import { adjustKarma, getConfig, grantUnlock, hasUnlock, unlocks } from '../progresso-server'
import { CENA_ID_RE, type Cena, type CenaEstado, type CondicaoCena, chaveEscolha, type Efeito, type EfeitoAplicado, type ProgressoCena } from './formato'
import { CENAS, getCena, passoPorId } from './registro'

/**
 * Servidor do motor de diálogo. Contrato: docs/redesign/DIALOGO.md.
 * - Progresso (passo em que parou, se terminou) em `dialog_progress`.
 * - Escolhas e efeitos em `dialog_events` (PK por jogador+cena+chave): cada efeito vale UMA vez.
 * - O cliente só diz "escolhi N na escolha X"; os efeitos vêm da cena registrada (lib/devo/dialogo/registro.ts).
 */

function cenaOu404(id: unknown): Cena {
  if (typeof id !== 'string' || !CENA_ID_RE.test(id)) throw new RecordError('Cena inválida.')
  const cena = getCena(id)
  if (!cena) throw new RecordError('Cena não encontrada.', 404)
  return cena
}

/**
 * Condição de história de uma cena (formato.ts → `CondicaoCena`). Lida do banco a cada pedido (nada fica em cache):
 * - `devolveu-e-dv`: o save diz que as Cartas Iniciais foram devolvidas à Melissa (`devolveuCartas`; saves de antes do
 *   campo: sem nenhuma carta do "Kit inicial" e sem trocas feitas) E há uma inscrição aceita num Deadly Vote já
 *   concluído (ou com resultado aplicado) em que o jogador não ficou "ausente".
 */
export async function condicaoCumprida(playerId: string, condicao: CondicaoCena, q: Queryable = pool): Promise<boolean> {
  if (condicao !== 'devolveu-e-dv') return false
  const [r] = await run<{ ok: boolean }>(
    q,
    `SELECT (
       EXISTS (
         SELECT 1 FROM deadly_vote_entries e JOIN deadly_votes v ON v.id = e.vote_id
          WHERE e.player_id = $1 AND e.admission = 'aceita' AND e.decision IS DISTINCT FROM 'ausente'
            AND (v.status = 'concluido' OR v.results_applied_at IS NOT NULL)
       )
       AND EXISTS (
         SELECT 1 FROM player_saves s
          WHERE s.player_id = $1
            AND CASE
                  WHEN s.data ? 'devolveuCartas' THEN (s.data->>'devolveuCartas') = 'true'
                  ELSE COALESCE((s.data->>'tradesCompleted')::int, 0) = 0
                   AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(s.data->'inventory', '[]'::jsonb)) c WHERE c->>'origin' = 'Kit inicial')
                END
       )
     ) AS ok`,
    [playerId],
  ).catch((err) => {
    console.error('[dialogo] condição', condicao, err)
    return [{ ok: false }]
  })
  return !!r?.ok
}

/** A cena exige uma flag ou uma condição de história? (Owner e Anfitrião passam sempre: `devo_tem_desbloqueio`.) */
async function exigirAcesso(playerId: string, cena: Cena, q: Queryable = pool) {
  if (cena.requer && !(await hasUnlock(playerId, cena.requer, q))) throw new RecordError('Esta cena ainda está trancada.', 403)
  if (cena.condicao && !(await unlocks(playerId, q)).total && !(await condicaoCumprida(playerId, cena.condicao, q)))
    throw new RecordError('Esta cena ainda está trancada.', 403)
}

/** Cenas com condição de história que este jogador já pode ver e ainda não terminou (o cliente abre sozinho). */
export async function cenasDisponiveis(playerId: string, feitas: Record<string, { fim: boolean }>): Promise<string[]> {
  const out: string[] = []
  for (const c of Object.values(CENAS)) {
    if (!c.condicao || feitas[c.id]?.fim) continue
    if (c.requer && !(await hasUnlock(playerId, c.requer))) continue
    if (await condicaoCumprida(playerId, c.condicao)) out.push(c.id)
  }
  return out
}

/** Minutos efetivos de um efeito de Tempo (a configuração do Owner substitui o número da cena). */
async function minutosDe(e: Extract<Efeito, { tipo: 'tempo' }>, q: Queryable = pool) {
  if (!e.config) return e.minutos
  const cfg = await getConfig<unknown>(e.config, q).catch(() => null)
  const v = typeof cfg?.value === 'number' ? cfg.value : Number(cfg?.value)
  return Number.isFinite(v) && Math.abs(v) <= 60 * 24 * 30 ? Math.trunc(v) : e.minutos
}

async function lerProgresso(playerId: string, cena: Cena, q: Queryable = pool): Promise<ProgressoCena> {
  const [p] = await run<{ step: number; done_at: Date | null }>(q, 'SELECT step, done_at FROM dialog_progress WHERE player_id = $1 AND scene_id = $2', [playerId, cena.id])
  const ev = await run<{ key: string; option_index: number | null }>(q, 'SELECT key, option_index FROM dialog_events WHERE player_id = $1 AND scene_id = $2 ORDER BY at', [playerId, cena.id])
  const escolhas: Record<string, number[]> = {}
  const efeitos: string[] = []
  for (const e of ev) {
    if (e.key.startsWith('e:')) {
      const id = e.key.split(':')[1]
      if (e.option_index !== null) (escolhas[id] ??= []).push(e.option_index)
    } else if (e.key.startsWith('p:')) efeitos.push(e.key.slice(2))
  }
  return { passo: Math.min(p?.step ?? 0, cena.passos.length), fim: !!p?.done_at, escolhas, efeitos }
}

/** Estado completo para o cliente montar a cena. */
export async function estadoCena(playerId: string, cenaId: unknown): Promise<CenaEstado> {
  const cena = cenaOu404(cenaId)
  await exigirAcesso(playerId, cena)
  const progresso = await lerProgresso(playerId, cena)
  const tempos: Record<string, number> = {}
  const itensReq = new Set<string>()
  for (const p of cena.passos) {
    if (p.tipo === 'escolha') {
      for (const [i, o] of p.opcoes.entries()) {
        for (const e of o.efeitos ?? []) if (e.tipo === 'tempo') tempos[`${p.id}:${i}`] = await minutosDe(e)
        if (o.requer) itensReq.add(o.requer.item)
      }
    } else if (p.tipo === 'efeito') {
      for (const e of p.efeitos) if (e.tipo === 'tempo') tempos[p.id] = await minutosDe(e)
    }
  }
  const itens: Record<string, number> = {}
  for (const k of itensReq) itens[k] = await itemBalance(playerId, k)
  const [k] = await run<{ karma: number }>(pool, 'SELECT karma FROM players WHERE id = $1', [playerId])
  return { progresso, tempos, itens, destino: destinoDoKarma(Number(k?.karma ?? 0)) }
}

/** Resumo de todas as cenas já começadas: `{ [cena]: { passo, fim } }` (gatilhos do cliente). */
export async function resumoCenas(playerId: string) {
  const rows = await run<{ scene_id: string; step: number; done_at: Date | null }>(pool, 'SELECT scene_id, step, done_at FROM dialog_progress WHERE player_id = $1', [playerId])
  return Object.fromEntries(rows.map((r) => [r.scene_id, { passo: r.step, fim: !!r.done_at }])) as Record<string, { passo: number; fim: boolean }>
}

/** Grava o passo em que o jogador está (retomar depois). Cena terminada não volta. */
export async function salvarPasso(playerId: string, cenaId: unknown, passoRaw: unknown) {
  const cena = cenaOu404(cenaId)
  await exigirAcesso(playerId, cena)
  const passo = Math.floor(Number(passoRaw))
  if (!Number.isFinite(passo) || passo < 0 || passo > cena.passos.length) throw new RecordError('Passo inválido.')
  await run(
    pool,
    `INSERT INTO dialog_progress (player_id, scene_id, step) VALUES ($1, $2, $3)
     ON CONFLICT (player_id, scene_id) DO UPDATE SET step = EXCLUDED.step, updated_at = now()
     WHERE dialog_progress.done_at IS NULL`,
    [playerId, cena.id, passo],
  )
  return { ok: true as const }
}

/** Aplica efeitos dentro da transação. Devolve o que foi aplicado (com minutos já resolvidos). */
async function aplicar(c: Queryable, playerId: string, cena: Cena, key: string, efeitos: Efeito[]) {
  const aplicados: Efeito[] = []
  const contatos: string[] = []
  let minutos = 0
  const idem = (i: number) => `dialogo:${cena.id}:${key}:${i}:${playerId}`
  for (const [i, e] of efeitos.entries()) {
    if (e.tipo === 'tempo') {
      const m = await minutosDe(e, c)
      if (m) await creditMinutes(playerId, m, c)
      minutos += m
      aplicados.push({ ...e, minutos: m })
    } else if (e.tipo === 'karma') {
      await adjustKarma({ playerId, delta: e.delta, motivo: 'dialogo', ref: `${cena.id}:${key}`, idem: idem(i) }, c)
      aplicados.push(e)
    } else if (e.tipo === 'item') {
      const qtd = Math.trunc(e.quantidade ?? 1)
      const op = { playerId, item: e.item, quantidade: Math.abs(qtd), motivo: 'dialogo', ref: `${cena.id}:${key}`, idem: idem(i) }
      if (qtd > 0) await grantItem(op, c)
      else if (qtd < 0) await consumeItem(op, c)
      aplicados.push(e)
    } else if (e.tipo === 'flag') {
      await grantUnlock(playerId, e.flag, 'narrativa', `dialogo:${cena.id}`, null, c)
      aplicados.push(e)
    } else if (e.tipo === 'contato') {
      contatos.push(e.npc)
      aplicados.push(e)
    }
  }
  return { aplicados, contatos, minutos }
}

async function registrar(
  playerId: string,
  cena: Cena,
  key: string,
  opcao: number | null,
  efeitos: Efeito[],
  antes?: (c: Queryable) => Promise<void>,
): Promise<{ novo: boolean; opcao: number | null; aplicados: Efeito[]; contatos: string[]; minutos: number }> {
  return txAs(playerId, async (c) => {
    const ins = await run<{ key: string }>(
      c,
      `INSERT INTO dialog_events (player_id, scene_id, key, option_index) VALUES ($1, $2, $3, $4)
       ON CONFLICT (player_id, scene_id, key) DO NOTHING RETURNING key`,
      [playerId, cena.id, key, opcao],
    )
    if (!ins.length) {
      const [old] = await run<{ option_index: number | null; applied: Efeito[] }>(c, 'SELECT option_index, applied FROM dialog_events WHERE player_id = $1 AND scene_id = $2 AND key = $3', [
        playerId,
        cena.id,
        key,
      ])
      const contatos = (old?.applied ?? []).flatMap((e) => (e.tipo === 'contato' ? [e.npc] : []))
      return { novo: false, opcao: old?.option_index ?? opcao, aplicados: [], contatos, minutos: 0 }
    }
    if (antes) await antes(c)
    const r = await aplicar(c, playerId, cena, key, efeitos)
    await run(c, 'UPDATE dialog_events SET applied = $4 WHERE player_id = $1 AND scene_id = $2 AND key = $3', [playerId, cena.id, key, JSON.stringify(r.aplicados)])
    return { novo: true, opcao, ...r }
  })
}

async function resposta(playerId: string, r: { opcao: number | null; aplicados: Efeito[]; contatos: string[]; minutos: number }): Promise<EfeitoAplicado> {
  // Tempo: o livro-caixa da Sala de Jogos entrega ao relógio do save e o cliente soma o mesmo delta.
  const timeDeltaMs = r.minutos ? await drainTime(playerId) : 0
  return { ok: true, ...(r.opcao !== null ? { opcao: r.opcao } : {}), aplicados: r.aplicados, timeDeltaMs, contatos: r.contatos }
}

/**
 * O jogador escolheu a opção `opcaoRaw` (0-based) da escolha `escolhaId`. Em escolha de uma opção só, a
 * PRIMEIRA escolha vale para sempre (recarregar e escolher outra devolve a original, sem efeito novo).
 */
export async function escolher(playerId: string, cenaId: unknown, escolhaId: unknown, opcaoRaw: unknown): Promise<EfeitoAplicado> {
  const cena = cenaOu404(cenaId)
  await exigirAcesso(playerId, cena)
  const passo = typeof escolhaId === 'string' ? passoPorId(cena, escolhaId, 'escolha') : null
  if (!passo) throw new RecordError('Escolha inválida.')
  const opcao = Math.floor(Number(opcaoRaw))
  const op = passo.opcoes[opcao]
  if (!op) throw new RecordError('Opção inválida.')
  const r = await registrar(playerId, cena, chaveEscolha(passo, opcao), opcao, op.efeitos ?? [], async (c) => {
    if (op.requer && (await itemBalance(playerId, op.requer.item, c)) < (op.requer.quantidade ?? 1)) {
      throw new RecordError(op.requer.motivo ?? 'Você não tem o item necessário.', 409)
    }
  })
  return resposta(playerId, r)
}

/** Passo `efeito` (fora de escolha). */
export async function aplicarEfeito(playerId: string, cenaId: unknown, efeitoId: unknown): Promise<EfeitoAplicado> {
  const cena = cenaOu404(cenaId)
  await exigirAcesso(playerId, cena)
  const passo = typeof efeitoId === 'string' ? passoPorId(cena, efeitoId, 'efeito') : null
  if (!passo) throw new RecordError('Efeito inválido.')
  const r = await registrar(playerId, cena, `p:${passo.id}`, null, passo.efeitos)
  return resposta(playerId, r)
}

/** Termina a cena: marca como vista e aplica `aoConcluir` (uma vez). */
export async function concluir(playerId: string, cenaId: unknown): Promise<EfeitoAplicado> {
  const cena = cenaOu404(cenaId)
  await exigirAcesso(playerId, cena)
  const r = await registrar(playerId, cena, 'fim', null, cena.aoConcluir ?? [], async (c) => {
    await run(
      c,
      `INSERT INTO dialog_progress (player_id, scene_id, step, done_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (player_id, scene_id) DO UPDATE SET step = EXCLUDED.step, done_at = coalesce(dialog_progress.done_at, now()), updated_at = now()`,
      [playerId, cena.id, cena.passos.length],
    )
  })
  return resposta(playerId, r)
}

/** Cena já terminada? (para gatilhos no servidor de outros sistemas). */
export async function cenaVista(playerId: string, cenaId: string, q: Queryable = pool) {
  const [r] = await run<{ ok: boolean }>(q, 'SELECT done_at IS NOT NULL AS ok FROM dialog_progress WHERE player_id = $1 AND scene_id = $2', [playerId, cenaId])
  return !!r?.ok
}
