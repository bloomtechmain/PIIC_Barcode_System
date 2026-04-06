import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Scan, CheckCircle, XCircle, HelpCircle, Lock } from 'lucide-react'
import { getAudit, scanBarcode, finalizeAudit } from '../api/audit.api'
import { AuditItem } from '../types'
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
      const feedbackMap = {
        FOUND:   { message: `FOUND: ${item.barcode}`,         type: 'success' as const },
        MISSING: { message: `MISSING: ${item.barcode}`,       type: 'error'   as const },
        UNKNOWN: { message: `UNKNOWN barcode: ${item.barcode}`, type: 'warn'  as const }
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

  if (isLoading) return <LoadingSpinner />
  if (!audit) return null

  const counts = {
    FOUND:   audit.auditItems?.filter(i => i.status === 'FOUND').length   ?? 0,
    MISSING: audit.auditItems?.filter(i => i.status === 'MISSING').length ?? 0,
    UNKNOWN: audit.auditItems?.filter(i => i.status === 'UNKNOWN').length ?? 0,
  }
  const isFinalized = !!audit.finalizedAt
  const sortedItems = [...(audit.auditItems ?? [])].reverse()

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
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy-700">Scan Results</h2>
        </div>
        {sortedItems.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-sm">No barcodes scanned yet</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead className="bg-navy-50 text-navy-600 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium">Barcode</th>
                <th className="px-6 py-3 text-left font-medium">Item</th>
                <th className="px-6 py-3 text-left font-medium">Weight</th>
                <th className="px-6 py-3 text-left font-medium">Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedItems.map(ai => (
                <tr key={ai.id} className="hover:bg-navy-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(ai.status)}
                      <Badge value={ai.status} />
                    </div>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-navy-700 font-semibold">{ai.barcode}</td>
                  <td className="px-6 py-3 capitalize">{ai.item?.itemType ?? '—'}</td>
                  <td className="px-6 py-3">
                    {ai.item?.weight
                      ? <WeightBadge weight={ai.item.weight} size="sm" />
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    {ai.item?.customer ? (
                      <div className="flex items-center gap-2">
                        <CustomerAvatar name={ai.item.customer.name} size="xs" />
                        <span>{ai.item.customer.name}</span>
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
