/**
 * Initial Audit report generator — Excel & PDF
 *
 * Columns:
 *   Ticket No | Customer | Item Type | [Audited Item Type] |
 *   Net Wt (g) | [Audited Net Wt (g)] |
 *   Gross Wt (g) | [Audited Gross Wt (g)] |
 *   Karatage | [Audited Karatage]
 *
 * "Audited" columns are inserted right after their base column, but only
 * when at least one item had that field edited after the audit was created.
 */

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Audit, Item } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportTicketGroup {
  key: string
  ticketNo: string
  customer: Item['customer']
  pawnDate: string
  items: Item[]
}

interface EditInfo {
  systemValue:  string   // value BEFORE this audit (oldValue of first edit)
  auditedValue: string   // value AFTER this audit  (newValue of last edit)
}

type ItemEditMap = Map<string, EditInfo>          // field → EditInfo
type AllEditsMap = Map<string, ItemEditMap>       // itemId → ItemEditMap

// ─── Build edit maps ──────────────────────────────────────────────────────────

function buildEditMaps(
  groups: ReportTicketGroup[],
  auditCreatedAt: string
): { allEdits: AllEditsMap; editedFields: Set<string>; auditAddedItems: Set<string> } {
  const allEdits: AllEditsMap      = new Map()
  const editedFields: Set<string>  = new Set()
  const auditAddedItems: Set<string> = new Set()
  const auditDate = new Date(auditCreatedAt)

  for (const group of groups) {
    for (const item of group.items) {
      const logs = (item.editLogs ?? [])
        .filter(l => new Date(l.editedAt) >= auditDate)
        .sort((a, b) => new Date(a.editedAt).getTime() - new Date(b.editedAt).getTime())

      if (!logs.length) continue

      const fieldMap: ItemEditMap = new Map()
      for (const log of logs) {
        // AUDIT_ADDED is a marker, not a value edit — track separately
        if (log.field === 'AUDIT_ADDED') {
          auditAddedItems.add(item.id)
          continue
        }
        editedFields.add(log.field)
        if (!fieldMap.has(log.field)) {
          fieldMap.set(log.field, { systemValue: log.oldValue, auditedValue: log.newValue })
        } else {
          fieldMap.get(log.field)!.auditedValue = log.newValue
        }
      }
      if (fieldMap.size > 0) allEdits.set(item.id, fieldMap)
    }
  }

  return { allEdits, editedFields, auditAddedItems }
}

// ─── Value formatters ─────────────────────────────────────────────────────────

function fmtWeight(val: string | number | null | undefined): string {
  if (val == null || val === '') return ''
  const n = parseFloat(String(val))
  return isNaN(n) ? '' : n.toFixed(3)
}

function fmtKaratage(val: string | number | null | undefined): string {
  if (val == null || val === '') return ''
  const n = parseInt(String(val))
  return isNaN(n) ? '' : String(n)
}

// ─── Build flat rows ──────────────────────────────────────────────────────────

function buildRows(
  groups: ReportTicketGroup[],
  allEdits: AllEditsMap,
  editedFields: Set<string>,
  auditAddedItems: Set<string>
): Record<string, string>[] {
  const rows: Record<string, string>[] = []

  for (const group of groups) {
    for (const item of group.items) {
      const itemEdits = allEdits.get(item.id)

      // Returns { sys: system/original value, aud: audited/corrected value }
      const getVals = (
        field: string,
        current: string | number | null | undefined,
        fmt: (v: string | number | null | undefined) => string
      ): { sys: string; aud: string } => {
        const edit = itemEdits?.get(field)
        const currentFmt = fmt(current)
        if (!edit) return { sys: currentFmt, aud: '' }
        return { sys: fmt(edit.systemValue), aud: fmt(edit.auditedValue) }
      }

      const typeVals    = getVals('itemType',    item.itemType,    v => String(v ?? ''))
      const wtVals      = getVals('weight',      item.weight,      fmtWeight)
      const gwVals      = getVals('grossWeight', item.grossWeight, fmtWeight)
      const katVals     = getVals('karatage',    item.karatage,    fmtKaratage)
      const remarkVals  = getVals('remarks',     item.remarks,     v => String(v ?? ''))

      const row: Record<string, string> = {
        'Ticket No':      group.ticketNo,
        'Customer':       group.customer?.name ?? '',
        'Item Type':      typeVals.sys,
      }
      if (editedFields.has('itemType'))    row['Audited Item Type']     = typeVals.aud
      row['Net Wt (g)']    = wtVals.sys
      if (editedFields.has('weight'))      row['Audited Net Wt (g)']    = wtVals.aud
      row['Gross Wt (g)']  = gwVals.sys
      if (editedFields.has('grossWeight')) row['Audited Gross Wt (g)']  = gwVals.aud
      row['Karatage']      = katVals.sys
      if (editedFields.has('karatage'))    row['Audited Karatage']      = katVals.aud
      row['Remarks']       = remarkVals.sys
      if (editedFields.has('remarks'))     row['Audited Remarks']       = remarkVals.aud
      if (auditAddedItems.size > 0)        row['Added in Audit']        = auditAddedItems.has(item.id) ? 'YES' : ''

      rows.push(row)
    }
  }

  return rows
}

// ─── Excel export ─────────────────────────────────────────────────────────────

export function downloadAuditExcel(
  audit: Audit,
  groups: ReportTicketGroup[],
  filterBranch: { id: string; name: string } | null
) {
  const { allEdits, editedFields, auditAddedItems } = buildEditMaps(groups, audit.createdAt)
  const rows = buildRows(groups, allEdits, editedFields, auditAddedItems)
  if (!rows.length) return

  const wb = XLSX.utils.book_new()

  // ── Info sheet ──
  const infoRows = [
    ['Initial Audit Report'],
    [],
    ['Generated',   new Date().toLocaleString()],
    ['Audit Date',  new Date(audit.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })],
    ['Created By',  audit.createdBy?.name ?? ''],
    ['Status',      audit.finalizedAt ? `Finalized ${new Date(audit.finalizedAt).toLocaleDateString()}` : 'In Progress'],
    [],
    ['Filters'],
    ['Branch',      filterBranch?.name ?? 'All Branches'],
    ['Date From',   audit.filterDateFrom ? new Date(audit.filterDateFrom).toLocaleDateString() : 'All'],
    ['Date To',     audit.filterDateTo   ? new Date(audit.filterDateTo).toLocaleDateString()   : 'All'],
    [],
    ['Total Items',    rows.length],
    ['Edited Items',   allEdits.size],
    ['Added in Audit', auditAddedItems.size],
    [],
    editedFields.size > 0
      ? ['Note: Columns starting with "Audited" show corrected values entered during this audit.']
      : ['No edits were made during this audit.'],
  ]

  const wsInfo = XLSX.utils.aoa_to_sheet(infoRows)
  wsInfo['!cols'] = [{ wch: 18 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Audit Info')

  // ── Items sheet ──
  const wsItems = XLSX.utils.json_to_sheet(rows)
  const headers = Object.keys(rows[0])
  wsItems['!cols'] = headers.map(h => ({
    wch: h === 'Remarks' || h === 'Audited Remarks' ? 30
       : h.startsWith('Audited')                    ? 18
       : h === 'Customer'                           ? 24
       : h === 'Ticket No'                          ? 16
       : 14
  }))
  XLSX.utils.book_append_sheet(wb, wsItems, 'Audit Items')

  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `initial-audit-${stamp}.xlsx`)
}

// ─── PDF export ───────────────────────────────────────────────────────────────

export function downloadAuditPDF(
  audit: Audit,
  groups: ReportTicketGroup[],
  filterBranch: { id: string; name: string } | null
) {
  const { allEdits, editedFields, auditAddedItems } = buildEditMaps(groups, audit.createdAt)
  const rows = buildRows(groups, allEdits, editedFields, auditAddedItems)
  if (!rows.length) return

  const headers = Object.keys(rows[0])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // ── Title ──
  doc.setFontSize(18)
  doc.setTextColor(30, 27, 75)   // deep indigo
  doc.text('Initial Audit Report', 14, 18)

  // ── Subtitle meta ──
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 120)
  const auditDateStr = new Date(audit.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  const rangeStr = audit.filterDateFrom
    ? `${new Date(audit.filterDateFrom).toLocaleDateString()} – ${audit.filterDateTo ? new Date(audit.filterDateTo).toLocaleDateString() : 'present'}`
    : 'All dates'
  const branchStr = filterBranch?.name ?? 'All branches'
  const statusStr = audit.finalizedAt ? `Finalized ${new Date(audit.finalizedAt).toLocaleDateString()}` : 'In Progress'
  doc.text(
    `Audit: ${auditDateStr}   ·   Range: ${rangeStr}   ·   Branch: ${branchStr}   ·   ${statusStr}   ·   ${rows.length} items`,
    14, 24
  )

  // ── Legend ──
  let tableY = 30
  if (editedFields.size > 0 && auditAddedItems.size > 0) {
    doc.setFillColor(254, 243, 199)
    doc.roundedRect(14, 27, 130, 5.5, 1.5, 1.5, 'F')
    doc.setFontSize(7.5); doc.setTextColor(146, 64, 14)
    doc.text('★  "Audited …" columns = corrected values', 16.5, 30.5)
    doc.setFillColor(220, 252, 231)
    doc.roundedRect(148, 27, 100, 5.5, 1.5, 1.5, 'F')
    doc.setFontSize(7.5); doc.setTextColor(21, 128, 61)
    doc.text('●  Green rows = items added during this audit', 150, 30.5)
    tableY = 36
  } else if (editedFields.size > 0) {
    doc.setFillColor(254, 243, 199)
    doc.roundedRect(14, 27, 170, 5.5, 1.5, 1.5, 'F')
    doc.setFontSize(7.5); doc.setTextColor(146, 64, 14)
    doc.text('★  Columns labelled "Audited …" show values corrected during this audit session', 16.5, 30.5)
    tableY = 36
  } else if (auditAddedItems.size > 0) {
    doc.setFillColor(220, 252, 231)
    doc.roundedRect(14, 27, 150, 5.5, 1.5, 1.5, 'F')
    doc.setFontSize(7.5); doc.setTextColor(21, 128, 61)
    doc.text('●  Green rows = items added during this audit session', 16.5, 30.5)
    tableY = 36
  }

  // ── Table ──
  autoTable(doc, {
    startY: tableY,
    head: [headers],
    body: rows.map(r => headers.map(h => r[h] ?? '')),
    styles: {
      fontSize: 7,
      cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [67, 56, 202],     // indigo-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    // Colour "Audited" header cells differently
    didParseCell: (data) => {
      const label = String(data.cell.raw ?? '')
      if (data.section === 'head') {
        if (label.startsWith('Audited')) {
          data.cell.styles.fillColor = [217, 119, 6]    // amber-600
          data.cell.styles.textColor = [255, 255, 255]
          data.cell.styles.fontStyle = 'bold'
        }
        if (label === 'Added in Audit') {
          data.cell.styles.fillColor = [22, 163, 74]    // green-600
          data.cell.styles.textColor = [255, 255, 255]
          data.cell.styles.fontStyle = 'bold'
        }
      }
      if (data.section === 'body') {
        const colHeader = headers[data.column.index] ?? ''
        // Audit-added rows — light green entire row
        const addedCol = headers.indexOf('Added in Audit')
        if (addedCol >= 0 && String(rows[data.row.index]?.['Added in Audit'] ?? '') === 'YES') {
          data.cell.styles.fillColor = [220, 252, 231]  // green-100
          if (colHeader === 'Added in Audit') {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.textColor = [21, 128, 61]  // green-700
          }
        }
        // Audited value cells — amber
        if (colHeader.startsWith('Audited') && String(data.cell.raw ?? '')) {
          data.cell.styles.fillColor = [255, 251, 235]  // amber-50
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = [120, 53, 15]    // amber-900
        }
      }
    },
    margin: { left: 14, right: 14 },
  })

  // ── Footer ──
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(160)
    doc.text(
      `Pearl Isle Capital · Initial Audit · ${new Date().toLocaleString()} · Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 6
    )
  }

  const stamp = new Date().toISOString().slice(0, 10)
  doc.save(`initial-audit-${stamp}.pdf`)
}
