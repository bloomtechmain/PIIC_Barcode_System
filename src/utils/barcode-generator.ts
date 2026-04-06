/**
 * Barcode format: GP-{YYYYMMDD}-{XX}-{NNNN}
 *
 * GP        → Gold Pawn system prefix
 * YYYYMMDD  → Issue date
 * XX        → First 2 letters of customer name (uppercase)
 * NNNN      → Customer's sequential pawn count, zero-padded to 4 digits
 *
 * Examples:
 *   John Doe's 1st item  → GP-20260404-JO-0001
 *   John Doe's 2nd item  → GP-20260404-JO-0002
 *   Ahmad Ali's 1st item → GP-20260404-AH-0001
 */
export const generateBarcode = (customerName: string, pawnCount: number): string => {
  const now = new Date()
  const datePart =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')

  // First 2 letters of customer name, alpha chars only, uppercase
  const letters = customerName.replace(/[^a-zA-Z]/g, '').toUpperCase()
  const namePart = (letters + 'XX').slice(0, 2)

  // Sequential count, zero-padded to 4 digits (supports up to 9999 pawns per customer)
  const countPart = String(pawnCount).padStart(4, '0')

  return `GP-${datePart}-${namePart}-${countPart}`
}

/** Parse a generated barcode back into its components. Returns null for unrecognised formats. */
export interface BarcodeParts {
  prefix:   string  // "GP"
  date:     string  // "20260404"
  initials: string  // "JO"
  count:    string  // "0003"
}

export const parseBarcode = (barcode: string): BarcodeParts | null => {
  const parts = barcode.split('-')
  if (parts.length !== 4 || parts[0] !== 'GP') return null
  return {
    prefix:   parts[0],
    date:     parts[1],
    initials: parts[2],
    count:    parts[3]
  }
}
