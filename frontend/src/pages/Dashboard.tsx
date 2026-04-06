import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Package, Users, ClipboardCheck, ArrowUpFromLine, TrendingUp, ChevronRight, Plus, Scan, Scale } from 'lucide-react'
import { getSummary } from '../api/report.api'
import StatCard from '../components/ui/StatCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
    enabled: isAdmin
  })

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-gradient-to-br from-navy-50 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
          <Package size={28} className="text-navy-600" />
        </div>
        <h1 className="text-2xl font-bold text-navy-700 mb-2">Welcome, {user?.name}</h1>
        <p className="text-gray-500 max-w-sm">Use the navigation to manage items, customers, releases and audits.</p>
      </div>
    )
  }

  if (isLoading) return <LoadingSpinner />

  const d = data!
  const totalWeight = d.breakdownByType.reduce((s, r) => s + (r.totalWeight ? Number(r.totalWeight) : 0), 0)
  const maxCount = Math.max(...d.breakdownByType.map(r => r.count), 1)

  const quickActions = [
    { label: 'Pawn Item',    icon: Plus,            action: () => navigate('/items'),     gradient: 'from-navy-600 to-navy-400'         },
    { label: 'New Customer', icon: Users,           action: () => navigate('/customers'),  gradient: 'from-magenta-500 to-pink-400'      },
    { label: 'Start Audit',  icon: Scan,            action: () => navigate('/audits'),     gradient: 'from-emerald-500 to-teal-400'      },
    { label: 'Release Item', icon: ArrowUpFromLine, action: () => navigate('/releases'),   gradient: 'from-blue-500 to-indigo-400'       },
  ]

  const barColors = [
    'from-navy-500 to-navy-400',
    'from-magenta-500 to-pink-400',
    'from-emerald-500 to-teal-400',
    'from-blue-500 to-indigo-400',
    'from-amber-500 to-orange-400',
    'from-purple-500 to-violet-400',
  ]

  return (
    <div className="space-y-6">

      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-7 md:px-8 md:py-9"
        style={{ background: 'linear-gradient(135deg, #1b1464 0%, #2a2480 55%, #a51655 100%)' }}>

        {/* Layered glow blobs */}
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-magenta-500/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-pink-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-8 w-64 h-64 rounded-full bg-blue-600/25 blur-3xl pointer-events-none" />

        {/* Geometric decoration layer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">

          {/* Large filled diamond — far right, partially clipped */}
          <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-64 h-64 rotate-45 rounded-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.12)' }} />
          {/* Inner diamond */}
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-40 h-40 rotate-45 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.10)' }} />

          {/* Top-right nested squares rotated */}
          <div className="absolute -top-8 right-28 w-36 h-36 rotate-[20deg] rounded-xl border border-white/10" />
          <div className="absolute top-2 right-36 w-20 h-20 rotate-[20deg] rounded-lg border border-white/10" />

          {/* Bottom-left triangle-ish shape using clip */}
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rotate-[15deg] rounded-2xl border border-white/10" />
          <div className="absolute -bottom-2 left-4 w-28 h-28 rotate-[15deg] rounded-xl border border-white/8" />

          {/* Horizontal glowing line accent */}
          <div className="absolute bottom-6 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.15) 70%, transparent 100%)' }} />

          {/* Top glowing line accent */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0.2) 60%, transparent 100%)' }} />

          {/* Fine diagonal grid — right portion */}
          <div className="absolute top-0 right-0 w-2/3 h-full opacity-[0.04]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 22px)' }} />

          {/* Dot field — left strip */}
          <div className="absolute inset-y-0 left-0 w-32 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

          {/* Concentric rings — bottom right */}
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full border border-white/10" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-4 -right-4 w-28 h-28 rounded-full border border-white/8" />

          {/* Small highlight orb — top left */}
          <div className="absolute top-3 left-6 w-10 h-10 rounded-full bg-white/10 blur-sm" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-4 sm:max-w-[60%]">
          <div>
            <p className="text-navy-200 text-sm font-medium mb-1">Good day,</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{user?.name}</h1>
            <p className="text-navy-200 text-sm mt-1.5">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {d.inventory.totalActive} active item{d.inventory.totalActive !== 1 ? 's' : ''} in vault
              </span>
              {totalWeight > 0 && (
                <span className="ml-3 inline-flex items-center gap-1.5">
                  <Scale size={11} className="text-pink-300" />
                  <span className="font-semibold text-white">{totalWeight.toFixed(2)}g</span> total weight
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-sm self-start">
            <TrendingUp size={14} className="text-pink-300 flex-shrink-0" />
            <span>{d.inventory.totalReleased} items released to date</span>
          </div>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Active Items"   value={d.inventory.totalActive}   icon={Package}         color="navy"    sub="Currently in vault" />
        <StatCard label="Released"       value={d.inventory.totalReleased} icon={ArrowUpFromLine} color="green"   sub="Returned to owners" />
        <StatCard label="Customers"      value={d.customers}               icon={Users}           color="blue"    sub="Registered profiles" />
        <StatCard label="Audits"         value={d.audits}                  icon={ClipboardCheck}  color="magenta"
          sub={d.lastAudit ? `Last ${new Date(d.lastAudit.finalizedAt).toLocaleDateString()}` : 'None yet'} />
      </div>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-0.5">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, action, gradient }) => (
            <button key={label} onClick={action}
              className={`relative bg-gradient-to-br ${gradient} text-white rounded-2xl p-4 flex flex-col items-start gap-3 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 overflow-hidden`}>
              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
              <div className="absolute -bottom-3 -right-2 w-12 h-12 rounded-full bg-white/10" />
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
              <div className="relative z-10 w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Icon size={18} />
              </div>
              <span className="relative z-10 text-sm font-semibold leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Inventory breakdown ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-navy-600 to-navy-500 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Package size={14} className="text-white" />
              </div>
              <h2 className="font-semibold text-white text-sm">Inventory by Type</h2>
            </div>
            <button onClick={() => navigate('/items')}
              className="text-xs text-white/60 hover:text-white font-medium flex items-center gap-0.5 transition-colors">
              View all <ChevronRight size={13} />
            </button>
          </div>

          {d.breakdownByType.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Package size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No active items yet</p>
            </div>
          ) : (
            <div className="px-5 py-5 space-y-4">
              {d.breakdownByType.map((row, i) => {
                const pct = Math.round((row.count / maxCount) * 100)
                const bar = barColors[i % barColors.length]
                return (
                  <div key={row.itemType}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700 capitalize">{row.itemType}</span>
                      <div className="flex items-center gap-3 text-gray-400 text-xs">
                        {row.totalWeight && <span>{Number(row.totalWeight).toFixed(2)}g</span>}
                        <span className="font-bold text-navy-700 text-sm">{row.count}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${bar} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Total active items</span>
                <span className="font-bold text-navy-700 text-base">{d.inventory.totalActive}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Last audit card */}
          {d.lastAudit ? (
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-emerald-100/60 blur-xl" />
              <div className="absolute bottom-0 right-4 w-16 h-16 rounded-full bg-teal-100/50 blur-lg" />
              <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-4 flex items-center gap-2 relative z-10">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <ClipboardCheck size={14} className="text-white" />
                </div>
                <span className="font-semibold text-white text-sm">Last Finalized Audit</span>
              </div>
              <div className="px-5 py-4 relative z-10">
                <p className="text-2xl font-bold text-navy-700 mb-1">
                  {new Date(d.lastAudit.finalizedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-sm text-gray-400">
                  {d.lastAudit.totalItemsAtTime} items recorded at audit time
                </p>
                <button onClick={() => navigate('/audits')}
                  className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5 transition-colors">
                  View all audits <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-6 text-center">
              <ClipboardCheck size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No audits completed yet</p>
              <button onClick={() => navigate('/audits')}
                className="mt-2 text-xs text-magenta-500 hover:text-magenta-600 font-medium transition-colors">
                Start first audit →
              </button>
            </div>
          )}

          {/* Customer + release tiles */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/customers')}
              className="relative bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 text-left hover:shadow-md hover:border-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 overflow-hidden group">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-blue-100/70 blur-xl" />
              <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-indigo-100/60 blur-lg" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
              <div className="relative z-10">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-400 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                  <Users size={17} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-navy-700">{d.customers}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Customers</p>
              </div>
            </button>
            <button onClick={() => navigate('/releases')}
              className="relative bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 text-left hover:shadow-md hover:border-magenta-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 overflow-hidden group">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-magenta-100/70 blur-xl" />
              <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-pink-100/60 blur-lg" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #a51655 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
              <div className="relative z-10">
                <div className="w-9 h-9 bg-gradient-to-br from-magenta-500 to-pink-400 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                  <ArrowUpFromLine size={17} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-navy-700">{d.inventory.totalReleased}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Released Items</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
