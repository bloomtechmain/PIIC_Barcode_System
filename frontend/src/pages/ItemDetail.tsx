import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Calendar, Tag, FileText,
  History, CheckCircle, ArrowUpFromLine, Scale, CreditCard, ChevronRight
} from 'lucide-react'
import { getItem } from '../api/item.api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Badge from '../components/ui/Badge'
import BarcodeDisplay from '../components/ui/BarcodeDisplay'
import BarcodeBreakdown from '../components/ui/BarcodeBreakdown'
import CustomerAvatar from '../components/ui/CustomerAvatar'
import WeightBadge from '../components/ui/WeightBadge'

const scanTypeLabel: Record<string, { label: string; color: string; dot: string }> = {
  CREATE: { label: 'Item Created',  color: 'text-navy-700 bg-navy-50 border-navy-200',          dot: 'bg-navy-400'    },
  AUDIT:  { label: 'Audit Scan',    color: 'text-magenta-700 bg-magenta-50 border-magenta-200', dot: 'bg-magenta-400' },
  VERIFY: { label: 'Manual Verify', color: 'text-gray-600 bg-gray-100 border-gray-200',         dot: 'bg-gray-400'    },
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem(id!),
    enabled: !!id
  })

  if (isLoading) return <LoadingSpinner />
  if (!item) return null

  const barcodeLabel = item.customer
    ? `${item.customer.name} · ${item.itemType}`
    : item.itemType

  return (
    <div className="space-y-4">

      {/* Back */}
      <button onClick={() => navigate('/items')} className="btn-ghost text-gray-500 -ml-2">
        <ArrowLeft size={16} /> Items
      </button>

      {/* ── Header banner ─────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-5"
        style={{ background: 'linear-gradient(135deg, #1b1464 0%, #2a2480 60%, #a51655 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border border-white/10" />
          <div className="absolute -top-2 -right-2 w-28 h-28 rounded-full border border-white/10" />
          <div className="absolute -bottom-6 -left-6 w-36 h-36 rotate-45 border border-white/10" />
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 18px)' }} />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Tag size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-0.5">Item Detail</p>
              <h1 className="text-xl font-bold text-white capitalize">{item.itemType}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs font-bold text-white/90 bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg tracking-wider">
              {item.barcode}
            </span>
            <Badge value={item.status} />
          </div>
        </div>
      </div>

      {/* ── Barcode + Details ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Barcode card */}
        <div className="card flex flex-col">
          <div className="px-6 pt-5 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Generated Barcode</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6 pt-4">
            <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-8 px-4">
              <BarcodeDisplay value={item.barcode} showPrint label={barcodeLabel} large />
            </div>
          </div>
        </div>

        {/* Details card */}
        <div className="card p-6 space-y-5">

          {/* Customer */}
          {item.customer && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
              <div
                onClick={() => navigate(`/customers/${item.customer!.id}`)}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-navy-50 to-blue-50 border border-navy-100 rounded-xl cursor-pointer hover:border-navy-300 transition-all group"
              >
                <CustomerAvatar name={item.customer.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-700 text-sm">{item.customer.name}</p>
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-gray-400 mt-0.5">
                    <CreditCard size={10} /> {item.customer.nic}
                  </span>
                </div>
                <ChevronRight size={15} className="text-navy-300 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </div>
            </div>
          )}

          {/* Item facts */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Item Info</p>
            <div className="grid grid-cols-2 gap-2">

              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0">
                  <Tag size={13} className="text-navy-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Type</p>
                  <p className="font-semibold text-gray-800 capitalize text-sm mt-0.5">{item.itemType}</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Scale size={13} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Weight</p>
                  <div className="mt-0.5"><WeightBadge weight={item.weight} size="sm" /></div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Calendar size={13} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Pawn Date</p>
                  <p className="font-semibold text-gray-800 text-sm mt-0.5">
                    {new Date(item.pawnDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Calendar size={13} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Registered</p>
                  <p className="font-semibold text-gray-800 text-sm mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {item.description && (
                <div className="col-span-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText size={13} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Description</p>
                    <p className="font-medium text-gray-700 text-sm mt-0.5 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Release */}
          {item.release && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Release</p>
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowUpFromLine size={13} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-700 text-sm">
                    {new Date(item.release.releaseDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {item.release.releasedBy && (
                      <span className="text-emerald-500 font-normal"> · by {item.release.releasedBy.name}</span>
                    )}
                  </p>
                  {item.release.notes && (
                    <p className="text-xs text-emerald-600 mt-0.5 italic">"{item.release.notes}"</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Barcode breakdown — full width ────────────────────────────── */}
      <div className="card p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Barcode Breakdown</p>
        <BarcodeBreakdown barcode={item.barcode} customerName={item.customer?.name} />
      </div>

      {/* ── Scan history — full width ─────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <History size={16} className="text-navy-500" />
          <h2 className="font-semibold text-navy-700">Scan History</h2>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
            {item.barcodeLogs?.length ?? 0} events
          </span>
        </div>

        {!item.barcodeLogs?.length ? (
          <div className="px-6 py-12 text-center">
            <History size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No scan history yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {item.barcodeLogs.map((log, i) => {
              const meta = scanTypeLabel[log.scanType] ?? {
                label: log.scanType,
                color: 'text-gray-600 bg-gray-100 border-gray-200',
                dot: 'bg-gray-400'
              }
              const isLast = i === item.barcodeLogs!.length - 1

              return (
                <div key={log.id} className="flex items-start gap-5 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                  {/* Timeline */}
                  <div className="flex flex-col items-center flex-shrink-0 pt-1.5">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-4 ring-white ${meta.dot}`} />
                    {!isLast && <div className="w-px bg-gray-200 mt-2" style={{ height: 28 }} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex items-start justify-between gap-4 min-w-0">
                    <div>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
                        <CheckCircle size={11} />
                        {meta.label}
                      </span>
                      {log.scannedBy && (
                        <p className="text-xs text-gray-400 mt-1.5 ml-0.5">by {log.scannedBy.name}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap pt-1 flex-shrink-0">
                      {new Date(log.scannedAt).toLocaleString('en-US', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
