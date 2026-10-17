/**
 * Cargos e permissões (DIRECAO-3 §3; tabela "Permissões por cargo" do dono).
 *
 * Este arquivo é PURO (sem banco): pode ser importado no cliente para esconder botões, mas a decisão
 * que vale é sempre a do servidor, que carrega o ator com `loadActor()` (lib/devo/permissoes-server.ts)
 * e chama `can()` / `requireCan()` antes de qualquer mudança.
 *
 * Contrato estável para os outros agentes: docs/redesign/FUNDACAO.md.
 */

/** Valor gravado em players.role. O Jogador continua 'player' no banco (compatibilidade). */
export type Cargo = 'owner' | 'anfitriao' | 'dealer' | 'player'

export const CARGOS: Cargo[] = ['owner', 'anfitriao', 'dealer', 'player']

/** Rótulos para telas internas. Nunca use `CARGO_LABEL.owner` em interface pública. */
export const CARGO_LABEL: Record<Cargo, string> = { owner: 'Owner', anfitriao: 'Anfitrião', dealer: 'Dealer', player: 'Jogador' }

/** Cargo que pode aparecer em payload público: Owner vira Jogador. Anfitrião e Dealer podem ser públicos. */
export type CargoPublico = Exclude<Cargo, 'owner'>

/** Lê qualquer valor (inclusive o antigo 'admin') e devolve um cargo válido. */
export function normalizeCargo(raw: unknown): Cargo {
  if (raw === 'admin') return 'owner'
  return (CARGOS as unknown[]).includes(raw) ? (raw as Cargo) : 'player'
}

/** Use em TODO payload público (perfil, miniperfil, ranking, chat, listas de participantes). */
export function publicCargo(raw: unknown): CargoPublico {
  const c = normalizeCargo(raw)
  return c === 'owner' ? 'player' : c
}

/** Equipe que opera Deadly Votes. */
export const isStaff = (c: Cargo) => c === 'owner' || c === 'anfitriao' || c === 'dealer'

/** Owner e Anfitrião veem todos os sistemas liberados (DIRECAO-3 §1b). */
export const seesAllSystems = (c: Cargo) => c === 'owner' || c === 'anfitriao'

export type Autorizacao = { escopo: string; ref: string | null }

/** Quem age. Montado no servidor a partir do banco (loadActor). */
export type Ator = {
  id: string
  cargo: Cargo
  /** Só Dealer tem: o Anfitrião (ou Owner) que o supervisiona hoje. */
  supervisorId: string | null
  /** Autorizações pontuais dadas pelo Owner (ex.: { escopo: 'recompensa.semanal', ref: '2026-10-12' }). */
  autorizacoes: Autorizacao[]
}

export type RecompensaTipo = 'evento' | 'externa' | 'semanal'

/** Pessoa-alvo resumida (para cargo, dados, transferência). */
export type PessoaAlvo = { id: string; cargo: Cargo; supervisorId: string | null }

/** Deadly Vote-alvo: quem criou e quem supervisiona (hoje) quem criou. */
export type VotoAlvo = { criadoPor: string | null; supervisorDoCriador: string | null }

/** Proposta de recompensa-alvo. */
export type PropostaAlvo = {
  tipo: RecompensaTipo
  propostoPor: string | null
  /** Supervisor do proponente quando a proposta foi criada (histórico). */
  supervisorOriginal: string | null
  /** Supervisor atual do proponente (após uma transferência). */
  supervisorAtual: string | null
  /** Para 'semanal': referência da semana/evento autorizado. */
  ref?: string | null
}

/**
 * Ações e o alvo que cada uma recebe. Ação sem alvo usa `undefined`.
 * Novas ações: acrescente aqui e no switch de `can()`, e documente em FUNDACAO.md.
 */
export type Alvos = {
  /** Acesso administrativo global (painel do Owner, catálogo, logs completos). */
  'admin.global': undefined
  /** Mudar o cargo de alguém. Anfitrião: só Jogador → Dealer sob ele, ou seu Dealer → Jogador. */
  'cargo.gerenciar': { pessoa: PessoaAlvo; novoCargo: Cargo; novoSupervisorId?: string | null }
  /** Transferir um Dealer para outro supervisor (só Owner). */
  'dealer.transferir': { pessoa: PessoaAlvo }
  'dv.criar': undefined
  /** Editar status, link, resultados e recompensas de um Deadly Vote. */
  'dv.editar': VotoAlvo
  /** Criar Deadly Vote tutorial (o que desbloqueia os sistemas). */
  'dv.tutorial': undefined
  /** Pré-selecionar/propor recompensa. 'evento' exige poder editar o voto de origem (se houver). */
  'recompensa.propor': { tipo: RecompensaTipo; voto?: VotoAlvo | null }
  /** Editar proposta (volta a pendente se já aprovada). */
  'recompensa.editar': PropostaAlvo
  'recompensa.aprovar': PropostaAlvo
  'recompensa.distribuir': PropostaAlvo
  /** Gerar código de convite do cargo pedido. `cota` = convites disponíveis do Jogador. */
  'convite.gerar': { cargo: Cargo; cota: number }
  /** Marcar convite como conta de teste. */
  'convite.teste': undefined
  /** Dados resumidos (cartas, arcano, fragmentos, P.P., participação) — sem senha/dados privados. */
  'dados.resumidos': { pessoaId: string }
  /** Dados completos (inventário inteiro, karma numérico, logs). */
  'dados.completos': { pessoaId: string }
  'jogar': undefined
  /** Liberar/revogar flags de desbloqueio manualmente. */
  'desbloqueio.override': undefined
  /** Ajuste manual de Karma (as escolhas de diálogo ajustam pelo servidor, sem ator). */
  'karma.ajustar': undefined
  /** Conceder/retirar itens diretamente, fora do fluxo de recompensas. */
  'item.conceder': undefined
  /** Ver o cargo real de outra pessoa (inclusive Owner). */
  'cargo.ver_owner': undefined
  /** Equipar qualquer cosmético do catálogo sem possuí-lo. */
  'cosmetico.equipar_qualquer': undefined
  /** Criar/editar o catálogo de cosméticos e itens. */
  'catalogo.editar': undefined
  /** Editar configurações (probabilidades do Poço etc.). */
  'config.editar': undefined
  /** Dar/revogar autorizações pontuais a Anfitriões. */
  'autorizacao.gerenciar': undefined
  /** Ver a mesa de equipe (Dealers e propostas) do próprio escopo. */
  'equipe.ver': undefined
  /** Especialista do Salão das Máscaras: aprovar/recusar itens da Bandeja e anúncios (toda a equipe). */
  'salao.avaliar': undefined
  /** Virtudes: ver P.P., Estágio e atributos dos jogadores na Mesa (Owner, Anfitrião). */
  'virtudes.ver': undefined
  /** Virtudes: disparar Evolução de Estágio e definir o Arcano de um jogador (Owner, Anfitrião). */
  'virtudes.evoluir': undefined
  /** Virtudes: lançar P.P. manualmente (Owner). A tabela de afinidade usa 'config.editar'. */
  'virtudes.ajustar': undefined
  /** Corporações: aprovar/recusar a fundação (avaliação administrativa da Companhia). Owner e Anfitrião. */
  'corporacao.aprovar': undefined
  /** Corporações: classificar como oficial ou Necro-Corporação (e rótulos provisórios: escopo, rivais). Owner e Anfitrião. */
  'corporacao.classificar': undefined
  /** Calendário: criar/editar/remover eventos programados (sem recompensas). Owner e Anfitrião. */
  'calendario.editar': undefined
  /** Calendário: check-ins de evento (lista de recompensas) e regras do check-in diário. Owner. */
  'calendario.recompensas': undefined
}

export type Acao = keyof Alvos

export const ACOES = [
  'admin.global', 'cargo.gerenciar', 'dealer.transferir', 'dv.criar', 'dv.editar', 'dv.tutorial', 'recompensa.propor',
  'recompensa.editar', 'recompensa.aprovar', 'recompensa.distribuir', 'convite.gerar', 'convite.teste', 'dados.resumidos',
  'dados.completos', 'jogar', 'desbloqueio.override', 'karma.ajustar', 'item.conceder', 'cargo.ver_owner',
  'cosmetico.equipar_qualquer', 'catalogo.editar', 'config.editar', 'autorizacao.gerenciar', 'equipe.ver', 'salao.avaliar',
  'virtudes.ver', 'virtudes.evoluir', 'virtudes.ajustar',
  'corporacao.aprovar', 'corporacao.classificar',
  'calendario.editar', 'calendario.recompensas',
] as const satisfies readonly Acao[]

function temAutorizacao(ator: Ator, escopo: string, ref?: string | null) {
  return ator.autorizacoes.some((a) => a.escopo === escopo && (a.ref === null || a.ref === (ref ?? null)))
}

/** O ator pode editar este Deadly Vote? Owner: todos; Anfitrião: os seus e os dos seus Dealers; Dealer: os seus. */
function podeEditarVoto(ator: Ator, v: VotoAlvo) {
  if (ator.cargo === 'owner') return true
  if (ator.cargo === 'anfitriao') return v.criadoPor === ator.id || v.supervisorDoCriador === ator.id
  if (ator.cargo === 'dealer') return v.criadoPor === ator.id
  return false
}

/** Anfitrião decide sobre a proposta? Só a própria, ou de Dealer que ele supervisionava ou supervisiona. */
function anfitriaoResponde(ator: Ator, p: PropostaAlvo) {
  if (p.tipo === 'externa') return false
  if (p.tipo === 'semanal') return temAutorizacao(ator, 'recompensa.semanal', p.ref)
  return p.propostoPor === ator.id || p.supervisorOriginal === ator.id || p.supervisorAtual === ator.id
}

/**
 * Função única de permissão. Retorna true/false; nunca lança. Sem ator (sessão ausente) → false.
 * Ex.: `can(ator, 'recompensa.aprovar', proposta)`.
 */
export function can<A extends Acao>(ator: Ator | null | undefined, acao: A, alvo?: Alvos[A]): boolean {
  if (!ator) return false
  const x: unknown = alvo
  const c = ator.cargo
  const owner = c === 'owner'
  switch (acao) {
    case 'jogar':
      return true
    case 'admin.global':
    case 'dealer.transferir':
    case 'desbloqueio.override':
    case 'karma.ajustar':
    case 'item.conceder':
    case 'cargo.ver_owner':
    case 'cosmetico.equipar_qualquer':
    case 'catalogo.editar':
    case 'config.editar':
    case 'autorizacao.gerenciar':
    case 'convite.teste':
    case 'virtudes.ajustar':
    case 'calendario.recompensas':
      return owner
    case 'dv.criar':
    case 'salao.avaliar':
      return isStaff(c)
    case 'dv.tutorial':
    case 'equipe.ver':
    case 'virtudes.ver':
    case 'virtudes.evoluir':
    case 'corporacao.aprovar':
    case 'corporacao.classificar':
    case 'calendario.editar':
      return owner || c === 'anfitriao'
    case 'dv.editar': {
      const v = x as Alvos['dv.editar'] | undefined
      return !!v && podeEditarVoto(ator, v)
    }
    case 'cargo.gerenciar': {
      const a = x as Alvos['cargo.gerenciar'] | undefined
      if (!a) return false
      if (owner) return a.pessoa.id !== ator.id // Owner não rebaixa a si mesmo (evita ficar sem Owner).
      if (c !== 'anfitriao') return false
      // "Limitado": Jogador → Dealer sob o próprio Anfitrião; Dealer dele → Jogador.
      if (a.pessoa.cargo === 'player' && a.novoCargo === 'dealer') return (a.novoSupervisorId ?? ator.id) === ator.id
      if (a.pessoa.cargo === 'dealer' && a.pessoa.supervisorId === ator.id && a.novoCargo === 'player') return true
      return false
    }
    case 'recompensa.propor': {
      const a = x as Alvos['recompensa.propor'] | undefined
      if (!a) return false
      if (owner) return true
      if (a.tipo === 'externa' || a.tipo === 'semanal') return c === 'anfitriao'
      // 'evento': Anfitrião e Dealer, no voto que podem editar (sem voto: só Anfitrião, ex. jogos semanais que organiza).
      if (c !== 'anfitriao' && c !== 'dealer') return false
      return a.voto ? podeEditarVoto(ator, a.voto) : c === 'anfitriao'
    }
    case 'recompensa.editar': {
      const p = x as Alvos['recompensa.editar'] | undefined
      if (!p) return false
      if (owner) return true
      if (p.propostoPor === ator.id && isStaff(c)) return true
      return c === 'anfitriao' && anfitriaoResponde(ator, p)
    }
    case 'recompensa.aprovar':
    case 'recompensa.distribuir': {
      const p = x as Alvos['recompensa.aprovar'] | undefined
      if (!p) return false
      if (owner) return true
      return c === 'anfitriao' && anfitriaoResponde(ator, p)
    }
    case 'convite.gerar': {
      const a = x as Alvos['convite.gerar'] | undefined
      if (!a) return false
      if (owner) return true
      if (c === 'anfitriao') return a.cargo === 'player' || a.cargo === 'dealer'
      if (c === 'player') return a.cargo === 'player' && a.cota > 0
      return false
    }
    case 'dados.resumidos': {
      const a = x as Alvos['dados.resumidos'] | undefined
      return !!a && (owner || c === 'anfitriao' || a.pessoaId === ator.id)
    }
    case 'dados.completos': {
      const a = x as Alvos['dados.completos'] | undefined
      return !!a && (owner || a.pessoaId === ator.id)
    }
    default:
      return false
  }
}

/** Cargo de `alvo` como `viewer` pode vê-lo: só quem tem 'cargo.ver_owner' enxerga Owner. */
export function cargoVisivel(viewer: Ator | null | undefined, alvo: unknown): Cargo {
  const c = normalizeCargo(alvo)
  return c === 'owner' && !can(viewer, 'cargo.ver_owner') ? 'player' : c
}
