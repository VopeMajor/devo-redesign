/**
 * Texto dirigido ao jogador: resolve o nome e a concordância de gênero (pedido do dono: quem escolhe
 * "Feminino" no prólogo é tratada no feminino em todas as falas).
 *
 * Marcadores aceitos no texto:
 * - `{nome}`: nome do personagem (ou o substituto informado).
 * - `{masculino|feminino}`: duas formas separadas por `|`. Ex.: `cansad{o|a}`, `{ele|ela}`,
 *   `{o|a} Record`, `{bem-vindo|bem-vinda}`, `{o último|a última}`.
 *
 * Gênero "Feminino" → segunda forma. "Masculino", "Prefiro não dizer" ou indefinido → primeira forma
 * (a forma em que o texto já estava escrito).
 */

export type GenderForm = 'm' | 'f'

/** Forma gramatical usada para o gênero salvo no perfil (state.profile.gender). */
export function genderForm(gender: string | null | undefined): GenderForm {
  return gender === 'Feminino' ? 'f' : 'm'
}

const GENDER_MARK = /\{([^{}|]*)\|([^{}|]*)\}/g

export type PlayerTextOptions = {
  name?: string | null
  gender?: string | null
  /** Usado quando ainda não há nome. Padrão: "jogador". */
  fallbackName?: string
}

/** Resolve `{nome}` e os marcadores `{m|f}` de um texto dirigido ao jogador. */
export function playerText(text: string, { name, gender, fallbackName = 'jogador' }: PlayerTextOptions = {}) {
  const f = genderForm(gender) === 'f'
  return text.replace(GENDER_MARK, (_, m: string, fem: string) => (f ? fem : m)).replaceAll('{nome}', name || fallbackName)
}

/** Substitui o marcador {nome} (e os de gênero) nas falas dos NPCs. Mantido para as chamadas antigas. */
export function withName(text: string, name: string | null | undefined, gender?: string | null) {
  return playerText(text, { name, gender })
}
