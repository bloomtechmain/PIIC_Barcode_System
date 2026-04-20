import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, BarChart3, Package, Scale, CheckCircle, Calendar, Phone, TrendingUp } from 'lucide-react'
import { getSummary, getMissingItems } from '../api/report.api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import CustomerAvatar from '../components/ui/CustomerAvatar'
import WeightBadge from '../components/ui/WeightBadge'

const typeColor: Record<string, string> = {
  ring:      'bg-magenta-50 text-magenta-600 border border-magenta-100',
  chain:     'bg-navy-50 text-navy-600 border border-navy-100',
  bracelet:  'bg-purple-50 text-purple-600 border border-purple-100',
  earrings:  'bg-pink-50 text-pink-600 border border-pink-100',
  necklace:  'bg-blue-50 text-blue-600 border border-blue-100',
  bangle:    'bg-amber-50 text-amber-600 border border-amber-100',
  pendant:   'bg-teal-50 text-teal-600 border border-teal-100',
  other:     'bg-gray-100 text-gray-500 border border-gray-200',
}

const barColors = [
  'from-navy-600 to-navy-400',
  'from-magenta-500 to-pink-400',
  'from-emerald-500 to-teal-400',
  'from-blue-500 to-indigo-400',
  'from-amber-500 to-orange-400',
  'from-purple-500 to-violet-400',
  'from-teal-500 to-cyan-400',
  'from-rose-500 to-pink-400',
]

export default function Reports() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['summary'],
    queryFn: getSummary
  })

  const { data: missingData, isLoading: loadingMissing } = useQuery({
    queryKey: ['missing'],
    queryFn: getMissingItems
  })

  if (loadingSummary || loadingMissing) return <LoadingSpinner />

  const totalWeight = summary?.breakdownByType.reduce(
    (s, r) => s + (r.totalWeight ? Number(r.totalWeight) : 0), 0
  ) ?? 0

  const maxCount = Math.max(...(summary?.breakdownByType.map(r => r.count) ?? [1]), 1)

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-navy-700">Reports</h1>
        <p className="text-gray-400 text-sm mt-0.5">Inventory analytics and audit findings</p>
      </div>

      {/* ── Summary stat tiles ──────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

          {/* Active Items */}
          <div className="relative bg-gradient-to-br from-navy-600 to-navy-400 rounded-2xl shadow-md shadow-navy-200 px-5 py-5 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/10" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
            <div className="relative z-10">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <Package size={17} className="text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{summary.inventory.totalActive}</p>
              <p className="text-xs text-navy-200 mt-1 font-medium uppercase tracking-wide">Active Items</p>
            </div>
          </div>

          {/* Released */}
          <div className="relative bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl shadow-md shadow-emerald-200 px-5 py-5 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/10" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
            <div className="relative z-10">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp size={17} className="text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{summary.inventory.totalReleased}</p>
              <p className="text-xs text-emerald-100 mt-1 font-medium uppercase tracking-wide">Released</p>
            </div>
          </div>

          {/* Total Weight */}
          <div className="relative bg-gradient-to-br from-magenta-500 to-pink-400 rounded-2xl shadow-md shadow-magenta-200 px-5 py-5 col-span-2 sm:col-span-1 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/10" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
            <div className="relative z-10">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <Scale size={17} className="text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{totalWeight.toFixed(2)}g</p>
              <p className="text-xs text-pink-100 mt-1 font-medium uppercase tracking-wide">Total Weight</p>
            </div>
          </div>

        </div>
      )}

      {/* ── Inventory breakdown ─────────────────────────────────────── */}
      {summary && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Section header */}
          <div className="bg-gradient-to-r from-navy-600 to-navy-500 px-5 py-4 flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Inventory Breakdown by Type</h2>
              <p className="text-navy-200 text-xs">{summary.breakdownByType.length} item type{summary.breakdownByType.length !== 1 ? 's' : ''} in vault</p>
            </div>
          </div>

          {summary.breakdownByType.length === 0 ? (
            <p className="px-6 py-8 text-gray-400 text-sm text-center">No active items in inventory</p>
          ) : (
            <>
              {/* Visual bars */}
              <div className="px-5 py-5 space-y-4 border-b border-gray-100">
                {summary.breakdownByType.map((row, i) => {
                  const pct = Math.round((row.count / maxCount) * 100)
                  const sharePct = summary.inventory.totalActive > 0
                    ? ((row.count / summary.inventory.totalActive) * 100).toFixed(1)
                    : '0'
                  return (
                    <div key={row.itemType}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${typeColor[row.itemType] ?? typeColor.other}`}>
                            {row.itemType}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          {row.totalWeight && <span>{Number(row.totalWeight).toFixed(2)}g</span>}
                          <span className="text-gray-400">{sharePct}%</span>
                          <span className="font-bold text-navy-700 text-sm w-6 text-right">{row.count}</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${barColors[i % barColors.length]} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Totals row */}
              <div className="px-5 py-3 bg-navy-50 flex items-center justify-between text-sm">
                <span className="font-semibold text-navy-700">Total</span>
                <div className="flex items-center gap-8 text-xs text-gray-500">
                  <span>{totalWeight.toFixed(3)}g</span>
                  <span>100%</span>
                  <span className="font-bold text-navy-700 text-base">{summary.inventory.totalActive}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Missing items ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Section header */}
        <div className={`px-5 py-4 flex items-center justify-between ${
          missingData?.missingItems?.length
            ? 'bg-gradient-to-r from-red-600 to-rose-500'
            : 'bg-gradient-to-r from-navy-600 to-navy-500'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <AlertTriangle size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Missing Items</h2>
              <p className="text-white/70 text-xs">From last finalized audit</p>
            </div>
          </div>
          {missingData?.finalizedAt && (
            <span className="flex items-center gap-1.5 text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full">
              <Calendar size={11} />
              {new Date(missingData.finalizedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {!missingData?.auditId ? (
          <EmptyState icon={AlertTriangle} title="No finalized audits yet"
            description="Finalize an audit to see missing items here." />
        ) : missingData.missingItems.length === 0 ? (
          <div className="px-6 py-10 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-full flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-emerald-700">All items accounted for</p>
              <p className="text-gray-400 text-sm mt-0.5">No missing items found in the last audit</p>
            </div>
          </div>
        ) : (
          <>
            {/* Missing count banner */}
            <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                {missingData.missingItems.length} item{missingData.missingItems.length !== 1 ? 's' : ''} unaccounted for
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="bg-gradient-to-r from-red-600 to-rose-500">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-red-100 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-red-100 uppercase tracking-wider">Weight</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-red-100 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-red-100 uppercase tracking-wider">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-50">
                  {missingData.missingItems.map(mi => (
                    <tr key={mi.id} className="hover:bg-red-50 transition-colors group">

                      {/* Type */}
                      <td className="px-5 py-4">
                        {mi.item?.itemType ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${typeColor[mi.item.itemType] ?? typeColor.other}`}>
                            {mi.item.itemType}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Weight */}
                      <td className="px-5 py-4">
                        {mi.item ? <WeightBadge weight={mi.item.weight} size="sm" /> : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        {mi.item?.customer?.name ? (
                          <div className="flex items-center gap-2.5">
                            <CustomerAvatar name={mi.item.customer.name} size="xs" />
                            <span className="font-medium text-gray-800">{mi.item.customer.name}</span>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        {mi.item?.customer?.phone ? (
                          <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Phone size={11} className="text-gray-400 flex-shrink-0" />
                            {mi.item.customer.phone}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
