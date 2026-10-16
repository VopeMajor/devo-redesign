/** Erro de regra de negócio com status HTTP. As rotas convertem em { ok: false, error } com esse status. */
export class RecordError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}
