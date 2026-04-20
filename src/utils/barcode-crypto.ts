import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES   = 12  // 96-bit IV (recommended for GCM)
const TAG_BYTES  = 16  // 128-bit auth tag

function getKey(): Buffer {
  const secret = process.env.BARCODE_SECRET
  if (!secret || secret.length !== 64) {
    throw new Error('BARCODE_SECRET must be set to a 64-character hex string (32 bytes)')
  }
  return Buffer.from(secret, 'hex')
}

/** Internal payload — never exposed outside this module */
interface BarcodePayload {
  d: string  // date YYYYMMDD
  i: string  // initials (2 chars)
  c: number  // pawn count
}

/**
 * Encrypt barcode data.
 * Output: base64url string — completely opaque, no structure visible.
 *
 * Layers:
 *   1. JSON-encode the payload
 *   2. AES-256-GCM encrypt with a random IV and the server secret key
 *   3. Prepend IV + GCM auth tag to the ciphertext
 *   4. base64url-encode the whole buffer → barcode-safe alphanumeric string
 */
export function encryptBarcodeData(date: string, initials: string, count: number): string {
  const key = getKey()
  const iv  = crypto.randomBytes(IV_BYTES)

  const plain  = JSON.stringify({ d: date, i: initials, c: count } satisfies BarcodePayload)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag   = cipher.getAuthTag()

  // Layout: [ IV (12) | authTag (16) | ciphertext (variable) ]
  const combined = Buffer.concat([iv, authTag, encrypted])
  return combined.toString('base64url')
}

/**
 * Decrypt and verify a barcode token.
 * Returns null if the token is invalid, tampered, or the key is wrong.
 */
export function decryptBarcodeData(token: string): BarcodePayload | null {
  try {
    const key     = getKey()
    const combined = Buffer.from(token, 'base64url')

    if (combined.length <= IV_BYTES + TAG_BYTES) return null

    const iv         = combined.subarray(0, IV_BYTES)
    const authTag    = combined.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
    const ciphertext = combined.subarray(IV_BYTES + TAG_BYTES)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return JSON.parse(decrypted.toString('utf8')) as BarcodePayload
  } catch {
    return null
  }
}
