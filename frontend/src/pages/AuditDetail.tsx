import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Scan, CheckCircle, XCircle, HelpCircle, Lock,
  ChevronDown, ChevronRight, Pencil, Save, X, History,
  PackageOpen, AlertTriangle
} from 'lucide-react'
import { getAudit, scanBarcode, finalizeAudit, updateAuditItem, bulkRelease } from '../api/audit.api'
import { AuditItem, ItemCorrection } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Badge from '../components/ui/Badge'
import CustomerAvatar from '../components/ui/CustomerAvatar'
import WeightBadge from '../components/ui/WeightBadge'
import { useAuth } from '../context/AuthContext'

const statusIcon = (s: string) => {
  if (s === 'FOUND')   return <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
  if (s === 'MISSING') return <XCircle     size={15} className="text-red-500 flex-shrink-0" />
  return                      <HelpCircle  size={15} className="text-magenta-400 flex-shrink-0" />
}

// Returns the most recent corrected value for a field, or undefined if no correction
function latestCorrection(corrections: ItemCorrection[] | undefined, field: string) {
  if (!corrections?.length) return undefined
  return [...corrections].filter(c => c.field === field).sort(
    (a, b) => new Date(b.correctedAt).getTime() - new Date(a.correctedAt).getTime()
  )[0]
}

// ── Expanded Row Panel ──────────────────────────────────────────────────────

interface ExpandedPanelProps {
  ai: AuditItem
  auditId: string
}

function ExpandedPanel({ ai, auditId }: ExpandedPanelProps) {
  const qc = useQueryClient()

  // All corrections for this item (from item.itemCorrections — full history across audits)
  const allCorrections = ai.item?.itemCorrections ?? []

  // ── Remarks ────────────────────────────────────────────────────────────────
  const [remarks, setRemarks] = useState(ai.remarks ?? '')
  const [remarksSaved, setRemarksSaved] = useState(false)

  const remarksMutation = useMutation({
    mutationFn: (val: string) => updateAuditItem(auditId, ai.id, { remarks: val }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit', auditId] })
      setRemarksSaved(true)
      setTimeout(() => setRemarksSaved(false), 2000)
    }
  })

  const saveRemarks = () => {
    if (remarks !== (ai.remarks ?? '')) remarksMutation.mutate(remarks)
  }

  // ── Edit fields ────────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const [editItemType, setEditItemType] = useState(ai.item?.itemType ?? '')
  const [editWeight,   setEditWeight]   = useState(String(ai.item?.weight ?? ''))
  const [editError, setEditError]       = useState('')

  // Effective current values (latest correction wins, else item field)
  const effectiveItemType = latestCorrection(allCorrections, 'itemType')?.newValue ?? ai.item?.itemType ?? ''
  const effectiveWeight   = latestCorrection(allCorrections, 'weight')?.newValue   ?? String(ai.item?.weight ?? '')

  const openEdit = () => {
    setEditItemType(effectiveItemType)
    setEditWeight(effectiveWeight)
    setEditError('')
    setEditing(true)
  }

  const editMutation = useMutation({
    mutationFn: (corrections: { field: string; newValue: string }[]) =>
      updateAuditItem(auditId, ai.id, { corrections }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit', auditId] })
      setEditing(false)
    },
    onError: (err: unknown) => {
      setEditError((err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Save failed')
    }
  })

  const saveEdit = () => {
    const corrections: { field: string; newValue: string }[] = []
    if (editItemType.trim() && editItemType.trim() !== effectiveItemType)
      corrections.push({ field: 'itemType', newValue: editItemType.trim() })
    if (editWeight.trim() && editWeight.trim() !== effectiveWeight)
      corrections.push({ field: 'weight', newValue: editWeight.trim() })
    if (!corrections.length) { setEditing(false); return }
    editMutation.mutate(corrections)
  }

  return (
    <div className="bg-navy-50/60 border-t border-gray-100 px-6 py-4 space-y-4">

      {/* Remarks */}
      <div>
        <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1 block">
          Remarks
        </label>
        <div className="flex gap-2 items-start">
          <textarea
            className="input text-sm flex-1 resize-none"
            rows={2}
            placeholder="Add remarks about this item…"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            onBlur={saveRemarks}
            disabled={remarksMutation.isPending}
          />
          {remarksSaved && (
            <span className="text-xs text-green-600 self-center whitespace-nowrap">Saved</span>
          )}
        </div>
      </div>

      {/* Edit Fields — only if item exists */}
      {ai.item && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide">
              Item Values
            </label>
            {!editing && (
              <button className="btn-ghost text-xs text-magenta-600 gap-1" onClick={openEdit}>
                <Pencil size={12} /> Edit
              </button>
            )}
          </div>

          {!editing ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400 text-xs">Item Type</span>
                <p className="font-medium text-navy-700 capitalize">{effectiveItemType || '—'}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Weight</span>
                <p className="font-medium text-navy-700">{effectiveWeight ? `${effectiveWeight}g` : '—'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Item Type
                    <span className="text-gray-400 ml-1">(was: {effectiveItemType})</span>
                  </label>
                  <input
                    className="input text-sm"
                    value={editItemType}
                    onChange={e => setEditItemType(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Weight (g)
                    <span className="text-gray-400 ml-1">(was: {effectiveWeight})</span>
                  </label>
                  <input
                    className="input text-sm"
                    type="number"
                    step="0.001"
                    value={editWeight}
                    onChange={e => setEditWeight(e.target.value)}
                  />
                </div>
              </div>
              {editError && (
                <p className="text-red-600 text-xs">{editError}</p>
              )}
              <div className="flex gap-2">
                <button className="btn-primary text-xs gap-1" onClick={saveEdit} disabled={editMutation.isPending}>
                  <Save size={12} /> {editMutation.isPending ? 'Saving…' : 'Save'}
                </button>
                <button className="btn-ghost text-xs gap-1" onClick={() => setEditing(false)}>
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Correction History */}
      {allCorrections.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <History size={13} className="text-navy-400" />
            <span className="text-xs font-semibold text-navy-600 uppercase tracking-wide">
              Correction History
            </span>
          </div>
          <div className="space-y-1.5">
            {allCorrections.map(c => (
              <div key={c.id} className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs bg-white border border-gray-100 rounded-lg px-3 py-2">
                <span className="font-medium text-navy-700 capitalize">{c.field}</span>
                <span className="text-red-500 line-through">{c.oldValue}</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-700 font-medium">{c.newValue}</span>
                <span className="text-gray-400 ml-auto">
                  {new Date(c.correctedAt).toLocaleString()} by {c.correctedBy.name}
                  {c.audit && (
                    <span className="ml-1 text-gray-300">
                      (Audit {new Date(c.audit.createdAt).toLocaleDateString()})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AuditDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAdmin } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [barcode, setBarcode]                   = useState('')
  const [scanError, setScanError]               = useState('')
  const [scanFeedback, setScanFeedback]         = useState<{ message: string; type: 'success' | 'error' | 'warn' } | null>(null)
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)
  const [expandedId, setExpandedId]             = useState<string | null>(null)
  // Bulk release selection
  const [selected, setSelected]                 = useState<Set<string>>(new Set())
  // Two-step modal: null | 'review' | 'confirm'
  const [releaseStep, setReleaseStep]           = useState<null | 'review' | 'confirm'>(null)
  const [releaseNotes, setReleaseNotes]         = useState('')
  const [releaseError, setReleaseError]         = useState('')

  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => getAudit(id!),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.finalizedAt ? false : 5000)
  })

  useEffect(() => {
    if (!audit?.finalizedAt) inputRef.current?.focus()
  }, [audit?.finalizedAt])

  const scanMutation = useMutation({
    mutationFn: (bc: string) => scanBarcode(id!, bc),
    onSuccess: (item: AuditItem) => {
      qc.invalidateQueries({ queryKey: ['audit', id] })
      setBarcode('')
      const owner = item.item?.customer?.name
      const feedbackMap = {
        FOUND:   { message: owner ? `FOUND — ${owner} · ${item.item?.itemType ?? ''}` : 'FOUND — item registered', type: 'success' as const },
        MISSING: { message: `MISSING — item not in system`,    type: 'error'   as const },
        UNKNOWN: { message: `UNKNOWN — barcode not in system`, type: 'warn'    as const }
      }
      setScanFeedback(feedbackMap[item.status])
      setTimeout(() => setScanFeedback(null), 2500)
      inputRef.current?.focus()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Scan failed'
      setScanError(msg)
      setTimeout(() => setScanError(''), 3000)
      inputRef.current?.select()
    }
  })

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeAudit(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit', id] })
      qc.invalidateQueries({ queryKey: ['audits'] })
      setShowFinalizeConfirm(false)
    }
  })

  const bulkReleaseMutation = useMutation({
    mutationFn: () => bulkRelease(id!, { itemIds: [...selected], notes: releaseNotes || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit', id] })
      qc.invalidateQueries({ queryKey: ['audits'] })
      qc.invalidateQueries({ queryKey: ['releases'] })
      setSelected(new Set())
      setReleaseStep(null)
      setReleaseNotes('')
      setReleaseError('')
    },
    onError: (err: unknown) => {
      setReleaseError((err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Release failed')
    }
  })

  if (isLoading) return <LoadingSpinner />
  if (!audit) return null

  const counts = {
    FOUND:   audit.auditItems?.filter(i => i.status === 'FOUND').length   ?? 0,
    MISSING: audit.auditItems?.filter(i => i.status === 'MISSING').length ?? 0,
    UNKNOWN: audit.auditItems?.filter(i => i.status === 'UNKNOWN').length ?? 0,
  }
  const isFinalized = !!audit.finalizedAt
  const sortedItems = [...(audit.auditItems ?? [])].reverse()

  // Only MISSING items whose underlying item is still ACTIVE (not yet released)
  const releaseableItems = sortedItems.filter(
    ai => ai.status === 'MISSING' && ai.item && ai.itemId && ai.item.status !== 'RELEASED'
  )
  const allMissingSelected = releaseableItems.length > 0 &&
    releaseableItems.every(ai => selected.has(ai.itemId!))

  const toggleSelectItem = (itemId: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(itemId) ? next.delete(itemId) : next.add(itemId)
      return next
    })

  const toggleSelectAll = () =>
    setSelected(allMissingSelected
      ? new Set()
      : new Set(releaseableItems.map(ai => ai.itemId!))
    )

  const selectedItems = releaseableItems.filter(ai => selected.has(ai.itemId!))

  const toggleExpand = (aiId: string) =>
    setExpandedId(prev => (prev === aiId ? null : aiId))

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/audits')} className="btn-ghost text-gray-500 -ml-2">
        <ArrowLeft size={16} /> Audits
      </button>

      {/* Header */}
      <div className="card px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-navy-700">Audit Session</h1>
            {isFinalized ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                <CheckCircle size={12} /> Finalized
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-magenta-700 bg-magenta-50 px-2.5 py-0.5 rounded-full">
                <Scan size={12} /> In Progress
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Started {new Date(audit.createdAt).toLocaleString()} by {audit.createdBy?.name}
          </p>
          {isFinalized && (
            <p className="text-sm text-gray-500">
              Finalized {new Date(audit.finalizedAt!).toLocaleString()}
            </p>
          )}
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Items at start: <span className="font-semibold text-navy-700">{audit.totalItemsAtTime}</span></p>
          {audit.notes && <p className="text-xs mt-1 italic">"{audit.notes}"</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl border border-emerald-200 shadow-sm px-5 py-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{counts.FOUND}</p>
          <p className="text-xs text-emerald-500 mt-1 font-medium">Found</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl border border-red-200 shadow-sm px-5 py-4 text-center">
          <p className="text-2xl font-bold text-red-700">{counts.MISSING}</p>
          <p className="text-xs text-red-400 mt-1 font-medium">Missing</p>
        </div>
        <div className="bg-gradient-to-br from-magenta-50 to-pink-100 rounded-2xl border border-magenta-200 shadow-sm px-5 py-4 text-center">
          <p className="text-2xl font-bold text-magenta-700">{counts.UNKNOWN}</p>
          <p className="text-xs text-magenta-400 mt-1 font-medium">Unknown</p>
        </div>
      </div>

      {/* Scanner */}
      {!isFinalized && (
        <div className="card p-5">
          <p className="text-sm font-medium text-navy-700 mb-3 flex items-center gap-2">
            <Scan size={16} className="text-magenta-500" /> Scan Barcode
          </p>

          {scanFeedback && (
            <div className={`mb-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
              scanFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              scanFeedback.type === 'error'   ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-magenta-50 text-magenta-700 border border-magenta-200'
            }`}>
              {scanFeedback.message}
            </div>
          )}

          {scanError && (
            <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {scanError}
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); if (!barcode.trim()) return; setScanError(''); scanMutation.mutate(barcode.trim()) }}
            className="flex gap-2">
            <input
              ref={inputRef}
              className="input flex-1 font-mono text-lg py-3 tracking-widest"
              placeholder="Scan or type barcode, press Enter…"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              disabled={scanMutation.isPending}
              autoComplete="off"
            />
            <button type="submit" className="btn-primary px-5"
              disabled={scanMutation.isPending || !barcode.trim()}>
              {scanMutation.isPending ? '…' : 'Scan'}
            </button>
          </form>

          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {!showFinalizeConfirm ? (
                <button className="btn-secondary text-sm" onClick={() => setShowFinalizeConfirm(true)}>
                  <Lock size={14} /> Finalize Audit
                </button>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm text-gray-600 flex-1">
                    All unscanned active items will be marked as MISSING. Continue?
                  </p>
                  <button className="btn-danger text-sm whitespace-nowrap"
                    onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending}>
                    {finalizeMutation.isPending ? 'Finalizing…' : 'Yes, Finalize'}
                  </button>
                  <button className="btn-secondary text-sm" onClick={() => setShowFinalizeConfirm(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-navy-700">Scan Results</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click a row to add remarks or correct values</p>
          </div>
          {/* Select-all for MISSING when finalized */}
          {isFinalized && isAdmin && releaseableItems.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-red-500"
                checked={allMissingSelected}
                onChange={toggleSelectAll}
              />
              Select all missing ({releaseableItems.length})
            </label>
          )}
        </div>
        {sortedItems.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-sm">No barcodes scanned yet</p>
        ) : (
          <div>
            {sortedItems.map(ai => {
              const isExpanded = expandedId === ai.id
              const allCorrections = ai.item?.itemCorrections ?? []
              const effectiveItemType = latestCorrection(allCorrections, 'itemType')?.newValue ?? ai.item?.itemType
              const effectiveWeight   = latestCorrection(allCorrections, 'weight')?.newValue   ?? ai.item?.weight
              const hasCorrectionHistory = allCorrections.length > 0
              const isReleaseable = isFinalized && isAdmin && ai.status === 'MISSING' && !!ai.itemId && ai.item?.status !== 'RELEASED'
              const isItemReleased = ai.status === 'MISSING' && ai.item?.status === 'RELEASED'
              const isChecked = isReleaseable && selected.has(ai.itemId!)

              return (
                <div key={ai.id} className={`border-b border-gray-100 last:border-b-0 ${isChecked ? 'bg-red-50/50' : ''}`}>
                  {/* Collapsed row */}
                  <div
                    className="flex items-center gap-3 px-6 py-3 hover:bg-navy-50 transition-colors cursor-pointer select-none"
                    onClick={() => toggleExpand(ai.id)}
                  >
                    {/* Checkbox for releaseable MISSING items */}
                    {isReleaseable ? (
                      <span className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded accent-red-500 cursor-pointer"
                          checked={isChecked}
                          onChange={() => toggleSelectItem(ai.itemId!)}
                        />
                      </span>
                    ) : (
                      /* Expand chevron */
                      <span className="text-gray-300 flex-shrink-0">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                      {isItemReleased ? (
                        <>
                          <CheckCircle size={15} className="text-blue-500 flex-shrink-0" />
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            Released
                          </span>
                        </>
                      ) : (
                        <>
                          {statusIcon(ai.status)}
                          <Badge value={ai.status} />
                        </>
                      )}
                    </div>

                    {/* Ticket ID */}
                    <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0 tracking-tight hidden sm:inline">
                      {ai.item?.description?.match(/Ticket No:\s*(\S+)/)?.[1] ?? ai.barcode}
                    </span>

                    {/* Item type — show corrected value */}
                    <span className="text-sm capitalize flex-1 min-w-0 truncate">
                      {effectiveItemType
                        ? <>{effectiveItemType}{hasCorrectionHistory && <span className="ml-1 text-[10px] text-magenta-400 font-medium">✎</span>}</>
                        : <span className="text-gray-400">—</span>}
                    </span>

                    {/* Weight */}
                    <span className="flex-shrink-0">
                      {effectiveWeight
                        ? <WeightBadge weight={effectiveWeight} size="sm" />
                        : <span className="text-gray-400 text-sm">—</span>}
                    </span>

                    {/* Customer */}
                    <span className="flex-shrink-0 w-36 min-w-0">
                      {ai.item?.customer ? (
                        <div className="flex items-center gap-1.5" title={ai.item.customer.name}>
                          <CustomerAvatar name={ai.item.customer.name} size="xs" />
                          <span className="text-sm truncate min-w-0">{ai.item.customer.name}</span>
                        </div>
                      ) : <span className="text-gray-400 text-sm">—</span>}
                    </span>

                    {/* Remarks indicator */}
                    {ai.remarks && (
                      <span className="text-xs text-gray-400 italic flex-shrink-0 max-w-[120px] truncate" title={ai.remarks}>
                        "{ai.remarks}"
                      </span>
                    )}
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <ExpandedPanel ai={ai} auditId={id!} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Sticky action bar ─────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40
          bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-3
          flex items-center gap-4 min-w-[340px]">
          <PackageOpen size={18} className="text-red-400 flex-shrink-0" />
          <span className="text-sm flex-1">
            <span className="font-bold text-red-300">{selected.size}</span> item{selected.size > 1 ? 's' : ''} selected
          </span>
          <button
            className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
          <button
            className="text-xs bg-red-600 hover:bg-red-500 font-semibold px-4 py-1.5 rounded-lg transition-colors"
            onClick={() => { setReleaseError(''); setReleaseStep('review') }}
          >
            Release Selected →
          </button>
        </div>
      )}

      {/* ── Two-step Release Modal ─────────────────────────────────────────── */}
      {releaseStep && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

            {/* Step 1 — Review */}
            {releaseStep === 'review' && (
              <>
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-navy-700">Review Release</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    You are about to release <span className="font-semibold text-red-600">{selectedItems.length}</span> missing item{selectedItems.length > 1 ? 's' : ''}.
                  </p>
                </div>

                {/* Item list */}
                <div className="px-6 py-3 max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {selectedItems.map(ai => {
                    const allC = ai.item?.itemCorrections ?? []
                    const iType = latestCorrection(allC, 'itemType')?.newValue ?? ai.item?.itemType ?? '—'
                    const wt    = latestCorrection(allC, 'weight')?.newValue   ?? String(ai.item?.weight ?? '—')
                    return (
                      <div key={ai.id} className="py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-700 capitalize truncate">{iType}</p>
                          <p className="text-xs text-gray-500">{wt}g</p>
                        </div>
                        {ai.item?.customer && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <CustomerAvatar name={ai.item.customer.name} size="xs" />
                            <span className="text-xs text-gray-600">{ai.item.customer.name}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Optional notes */}
                <div className="px-6 py-3 border-t border-gray-100">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Release notes (optional)</label>
                  <input
                    className="input text-sm w-full"
                    placeholder="e.g. Customer collected items"
                    value={releaseNotes}
                    onChange={e => setReleaseNotes(e.target.value)}
                  />
                </div>

                <div className="px-6 pb-5 flex justify-end gap-3">
                  <button className="btn-secondary text-sm" onClick={() => setReleaseStep(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn-danger text-sm gap-1.5"
                    onClick={() => setReleaseStep('confirm')}
                  >
                    Proceed to Confirm →
                  </button>
                </div>
              </>
            )}

            {/* Step 2 — Final confirm */}
            {releaseStep === 'confirm' && (
              <>
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={22} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-lg font-bold text-red-700">Final Confirmation</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        This will permanently mark <span className="font-bold">{selectedItems.length}</span> item{selectedItems.length > 1 ? 's' : ''} as <span className="font-bold text-red-600">RELEASED</span>.
                        This action <span className="font-bold">cannot be undone</span>.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 space-y-1">
                    {selectedItems.map(ai => (
                      <div key={ai.id} className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold capitalize">{ai.item?.itemType ?? '—'}</span>
                        <span className="text-xs capitalize text-red-500">{ai.item?.customer?.name ?? '—'}</span>
                      </div>
                    ))}
                  </div>

                  {releaseError && (
                    <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {releaseError}
                    </p>
                  )}
                </div>

                <div className="px-6 pb-5 flex justify-end gap-3">
                  <button className="btn-secondary text-sm" onClick={() => setReleaseStep('review')}
                    disabled={bulkReleaseMutation.isPending}>
                    ← Back
                  </button>
                  <button
                    className="btn-danger text-sm font-bold gap-1.5"
                    onClick={() => bulkReleaseMutation.mutate()}
                    disabled={bulkReleaseMutation.isPending}
                  >
                    {bulkReleaseMutation.isPending ? 'Releasing…' : `Confirm Release ${selectedItems.length} Item${selectedItems.length > 1 ? 's' : ''}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
