import crypto from 'crypto'

/**
 * Generate a short, random, opaque barcode token.
 *
 * 12 random bytes → 16-character base64url string.
 *
 * - Unreadable: random bytes encode nothing about the customer
 * - Unique:     2^96 space makes collisions impossible in practice
 * - Short:      16 characters produces a compact CODE128 barcode image
 */
export const generateBarcode = (): string => {
  return crypto.randomBytes(12).toString('base64url')
}
