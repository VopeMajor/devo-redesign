/**
 * Web Push sem dependências, só com Web Crypto + fetch, para rodar igual no Cloudflare Workers
 * e no Node (>= 20). Substitui o pacote `web-push`, que depende de `https`, `crypto.createECDH`,
 * `jws` e `asn1.js`.
 *
 * - Criptografia da mensagem: RFC 8291 (Message Encryption for Web Push) com `aes128gcm` (RFC 8188),
 *   um único registro, que é o mesmo formato padrão do `web-push`.
 * - Autenticação do servidor: VAPID (RFC 8292), JWT ES256 no cabeçalho `Authorization: vapid t=…, k=…`.
 *
 * As chaves VAPID continuam no mesmo formato do `web-push` (base64url da chave pública EC P-256
 * não comprimida de 65 bytes e da privada "d" de 32 bytes), então as já salvas no banco servem.
 */

const subtle = () => globalThis.crypto.subtle
const enc = new TextEncoder()

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function b64urlDecode(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

/** Cópia com ArrayBuffer próprio (as tipagens do Web Crypto não aceitam views de SharedArrayBuffer). */
function buf(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await subtle().importKey('raw', buf(ikm), 'HKDF', false, ['deriveBits'])
  const bits = await subtle().deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: buf(salt), info: buf(info) }, key, length * 8)
  return new Uint8Array(bits)
}

/** Gera um par VAPID no formato do `web-push` (base64url: pública crua de 65 bytes, privada "d" de 32 bytes). */
export async function generateVAPIDKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const pair = (await subtle().generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair
  const publicRaw = new Uint8Array(await subtle().exportKey('raw', pair.publicKey))
  const jwk = await subtle().exportKey('jwk', pair.privateKey)
  return { publicKey: b64urlEncode(publicRaw), privateKey: jwk.d! }
}

/** Monta a chave privada ECDSA a partir do par salvo (a JWK precisa de x/y, que saem da pública crua). */
async function importVapidPrivateKey(publicKey: string, privateKey: string): Promise<CryptoKey> {
  const raw = b64urlDecode(publicKey)
  if (raw.length !== 65 || raw[0] !== 4) throw new Error('Chave pública VAPID inválida')
  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    x: b64urlEncode(raw.slice(1, 33)),
    y: b64urlEncode(raw.slice(33, 65)),
    d: privateKey,
    ext: true,
  }
  return subtle().importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
}

/** JWT VAPID (ES256). A assinatura do Web Crypto já sai no formato r||s exigido pelo JWS. */
export async function vapidAuthorization(
  endpoint: string,
  vapid: { subject: string; publicKey: string; privateKey: string },
  expiresInSeconds = 12 * 60 * 60,
): Promise<string> {
  const header = b64urlEncode(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = b64urlEncode(
    enc.encode(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
        sub: vapid.subject,
      }),
    ),
  )
  const unsigned = `${header}.${claims}`
  const key = await importVapidPrivateKey(vapid.publicKey, vapid.privateKey)
  const signature = new Uint8Array(await subtle().sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned)))
  return `vapid t=${unsigned}.${b64urlEncode(signature)}, k=${vapid.publicKey}`
}

type EncryptOptions = {
  /** Só para testes (vetor do RFC 8291): par efêmero e salt fixos. */
  asKeyPair?: CryptoKeyPair
  salt?: Uint8Array
}

/** Criptografa `payload` para a inscrição (RFC 8291, aes128gcm, um registro de até 4096 bytes). */
export async function encryptPayload(
  keys: { p256dh: string; auth: string },
  payload: Uint8Array,
  options: EncryptOptions = {},
): Promise<Uint8Array> {
  const uaPublic = b64urlDecode(keys.p256dh)
  const authSecret = b64urlDecode(keys.auth)
  const salt = options.salt ?? globalThis.crypto.getRandomValues(new Uint8Array(16))
  const asPair =
    options.asKeyPair ?? ((await subtle().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair)
  const asPublic = new Uint8Array(await subtle().exportKey('raw', asPair.publicKey))
  const uaKey = await subtle().importKey('raw', buf(uaPublic), { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const ecdhSecret = new Uint8Array(await subtle().deriveBits({ name: 'ECDH', public: uaKey }, asPair.privateKey, 256))

  // IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info" || 0x00 || ua_public || as_public, 32)
  const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublic, asPublic)
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32)
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)

  const recordSize = 4096
  // Registro único: conteúdo + delimitador 0x02 (último registro), sem preenchimento.
  const plaintext = concat(payload, new Uint8Array([2]))
  if (plaintext.length + 16 > recordSize) throw new Error('Payload grande demais para um registro de push')
  const aesKey = await subtle().importKey('raw', buf(cek), 'AES-GCM', false, ['encrypt'])
  const ciphertext = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv: buf(nonce) }, aesKey, buf(plaintext)))

  // Cabeçalho aes128gcm: salt(16) || rs(uint32 BE) || idlen(1) || keyid(as_public, 65)
  const header = new Uint8Array(16 + 4 + 1)
  header.set(salt, 0)
  new DataView(header.buffer).setUint32(16, recordSize)
  header[20] = asPublic.length
  return concat(header, asPublic, ciphertext)
}

export class WebPushError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body: string,
  ) {
    super(message)
  }
}

export type PushSubscription = { endpoint: string; keys: { p256dh: string; auth: string } }

/** Envia uma notificação. Lança `WebPushError` (com `statusCode`) se o serviço de push recusar. */
export async function sendNotification(
  subscription: PushSubscription,
  payload: string,
  options: { vapidDetails: { subject: string; publicKey: string; privateKey: string }; TTL?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high' },
): Promise<{ statusCode: number }> {
  const body = await encryptPayload(subscription.keys, enc.encode(payload))
  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidAuthorization(subscription.endpoint, options.vapidDetails),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(options.TTL ?? 60 * 60 * 24 * 28),
      ...(options.urgency ? { Urgency: options.urgency } : {}),
    },
    body: buf(body),
  })
  const text = await res.text().catch(() => '')
  if (!res.ok) throw new WebPushError(`Push recusado (${res.status})`, res.status, text)
  return { statusCode: res.status }
}
