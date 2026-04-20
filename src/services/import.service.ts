import * as XLSX from 'xlsx'
import { ScanType } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { generateBarcode } from '../utils/barcode-generator'

export interface ImportResult {
  customersCreated: number
  customersFound: number
  itemsCreated: number
  itemsSkipped: number
  errors: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise a NIC value that Excel may have converted to scientific notation */
function normaliseNic(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  if (typeof raw === 'number') {
    // e.g. 1.90005e+11 → "190005000000" (no decimals)
    return Math.round(raw).toString()
  }
  return String(raw).trim()
}

/** Parse "1-Ring-with Enamel" → "ring", "2-EARRINGS-With Stone/s" → "earrings" */
function parseItemType(description: string): string {
  const parts = description.split('-')
  if (parts.length >= 2) return parts[1].trim().toLowerCase()
  return description.trim().toLowerCase()
}

/** Build a rich description string from all CSV columns */
function buildDescription(row: Record<string, string>): string {
  const parts: string[] = []

  if (row.ticketNo)        parts.push(`Ticket No: ${row.ticketNo}`)
  if (row.branch)          parts.push(`Branch: ${row.branch}`)
  if (row.issuedDate)      parts.push(`Date: ${row.issuedDate}`)
  if (row.itemDescription) parts.push(`Item: ${row.itemDescription}`)
  if (row.grossWeight)     parts.push(`Gross Wt: ${row.grossWeight}g`)
  if (row.netWeight)       parts.push(`Net Wt: ${row.netWeight}g`)
  if (row.karatage)        parts.push(`Karatage: ${row.karatage}K`)
  if (row.totalWeight)     parts.push(`Total Wt: ${row.totalWeight}g`)
  if (row.advancedAmount)  parts.push(`Advanced: ${row.advancedAmount}`)
  if (row.outstanding)     parts.push(`Outstanding: ${row.outstanding}`)
  if (row.profitRate)      parts.push(`Profit Rate: ${row.profitRate}%`)

  return parts.join(' | ')
}

/** Convert an Excel serial date number or date string to a JS Date */
function parseDate(value: unknown): Date | null {
  if (!value) return null

  // Already a JS Date (xlsx can return these)
  if (value instanceof Date) return value

  // Excel serial number
  if (typeof value === 'number') {
    return XLSX.SSF.parse_date_code(value)
      ? new Date(Math.round((value - 25569) * 86400 * 1000))
      : null
  }

  // Text like "9/18/2025" or "18/9/2025"
  const d = new Date(String(value))
  return isNaN(d.getTime()) ? null : d
}

// ─── Column index resolver ────────────────────────────────────────────────────

/** Build a map of lowercased header → array index from the first row */
function buildColMap(headerRow: unknown[]): Record<string, number> {
  const map: Record<string, number> = {}
  headerRow.forEach((h, i) => {
    const key = String(h ?? '').trim().toLowerCase()
    if (key) map[key] = i
  })
  return map
}

function col(row: unknown[], map: Record<string, number>, name: string): unknown {
  const idx = map[name.toLowerCase()]
  return idx !== undefined ? row[idx] : ''
}

// ─── Main import function ─────────────────────────────────────────────────────

export async function importFromBuffer(
  buffer: Buffer,
  createdById: string
): Promise<ImportResult> {
  const result: ImportResult = {
    customersCreated: 0,
    customersFound: 0,
    itemsCreated: 0,
    itemsSkipped: 0,
    errors: []
  }

  // Parse workbook
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  if (rows.length < 2) return result

  // Build column map from header row (row 0)
  const colMap   = buildColMap(rows[0] as unknown[])
  const dataRows = rows.slice(1)


  for (let i = 0; i < dataRows.length; i++) {
    const row    = dataRows[i] as unknown[]
    const rowNum = i + 2 // 1-indexed, skipping header

    // ── Extract columns by header name ────────────────────────────────────────
    const branch          = String(col(row, colMap, 'branch name')          ?? '').trim()
    const issuedDateRaw   = col(row, colMap, 'issued date')
    const customerName    = String(col(row, colMap, 'customer name')         ?? '').trim()
    const nicRaw          = col(row, colMap, 'nic')
    const ticketNo        = String(col(row, colMap, 'ticket no')             ?? '').trim()
    const itemDescription = String(col(row, colMap, 'item description')      ?? '').trim()
    const grossWeight     = String(col(row, colMap, 'gross weight')          ?? '').trim()
    const netWeightStr    = String(col(row, colMap, 'net weight')            ?? '').trim()
    const karatage        = String(col(row, colMap, 'karatage')              ?? '').trim()
    const totalWeight     = String(col(row, colMap, 'total weight')          ?? '').trim()
    const advancedAmount  = String(col(row, colMap, 'advanced amount')       ?? '').trim()
    const outstanding     = String(col(row, colMap, 'outstanding amount')    ?? '').trim()
    const profitRate      = String(col(row, colMap, 'profit rate')           ?? '').trim()

    // ── Validate required fields ──────────────────────────────────────────────
    const nic = normaliseNic(nicRaw)
    if (!nic) {
      result.errors.push(`Row ${rowNum}: missing NIC — skipped`)
      result.itemsSkipped++
      continue
    }
    if (!customerName) {
      result.errors.push(`Row ${rowNum}: missing customer name — skipped`)
      result.itemsSkipped++
      continue
    }
    if (!ticketNo) {
      result.errors.push(`Row ${rowNum}: missing Ticket No — skipped`)
      result.itemsSkipped++
      continue
    }
    if (!itemDescription) {
      result.errors.push(`Row ${rowNum}: missing item description — skipped`)
      result.itemsSkipped++
      continue
    }

    const pawnDate = parseDate(issuedDateRaw)
    if (!pawnDate) {
      result.errors.push(`Row ${rowNum}: invalid date "${issuedDateRaw}" — skipped`)
      result.itemsSkipped++
      continue
    }

    const netWeight = parseFloat(netWeightStr.replace(/,/g, ''))
    if (isNaN(netWeight) || netWeight <= 0) {
      result.errors.push(`Row ${rowNum}: invalid net weight "${netWeightStr}" — skipped`)
      result.itemsSkipped++
      continue
    }

    // ── Find or create customer ───────────────────────────────────────────────
    let customer = await prisma.customer.findUnique({ where: { nic } })
    if (customer) {
      result.customersFound++
    } else {
      customer = await prisma.customer.create({
        data: { name: customerName, nic }
      })
      result.customersCreated++
    }

    // ── Generate a unique random barcode ─────────────────────────────────────
    let barcode: string
    do { barcode = generateBarcode() }
    while (await prisma.item.findUnique({ where: { barcode } }))

    // ── Build description from all columns (ticket no preserved here) ─────────
    const description = buildDescription({
      branch,
      issuedDate:      String(issuedDateRaw ?? '').trim(),
      itemDescription,
      grossWeight,
      netWeight:       netWeightStr,
      karatage,
      totalWeight,
      advancedAmount,
      outstanding,
      profitRate,
      ticketNo
    })

    // ── Create item ───────────────────────────────────────────────────────────
    const itemType = parseItemType(itemDescription)

    await prisma.$transaction(async tx => {
      const item = await tx.item.create({
        data: {
          barcode,
          customerId:  customer!.id,
          itemType,
          weight:      netWeight,
          description,
          pawnDate
        }
      })

      await tx.barcodeLog.create({
        data: {
          itemId:      item.id,
          scannedById: createdById,
          scanType:    ScanType.CREATE
        }
      })
    })

    result.itemsCreated++
  }

  return result
}
