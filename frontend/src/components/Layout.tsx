import { Outlet } from 'react-router-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Package, ArrowUpFromLine,
  ClipboardCheck, BarChart3, LogOut, Gem, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/customers', icon: Users,           label: 'Customers'  },
  { to: '/items',     icon: Package,         label: 'Items'      },
  { to: '/releases',  icon: ArrowUpFromLine, label: 'Releases'   },
  { to: '/audits',    icon: ClipboardCheck,  label: 'Audits'     },
]

const adminItems = [
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const allBottomItems = [...navItems, ...(isAdmin ? adminItems : [])]

  return (
    <div className="flex h-screen bg-navy-100 overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 bg-navy-600 relative overflow-hidden">

        {/* Sidebar background decoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-navy-500/50" />
        <div className="absolute top-32 -left-8 w-24 h-24 rounded-full bg-magenta-500/20" />
        <div className="absolute bottom-20 -right-6 w-28 h-28 rounded-full bg-navy-500/40" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }}
        />

        {/* ── Logo ── */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-6">
          <div className="w-10 h-10 bg-gradient-to-br from-magenta-500 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-magenta-900/40">
            <Gem size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight tracking-tight">Pearl Isle</p>
            <p className="text-navy-300 text-xs tracking-wide">Capital · Pawn Manager</p>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="relative z-10 mx-5 h-px bg-gradient-to-r from-transparent via-navy-400 to-transparent mb-2" />

        {/* ── Nav links ── */}
        <nav className="relative z-10 flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 py-2 text-[10px] font-bold text-navy-400 uppercase tracking-widest">Menu</p>

          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-magenta-500 to-pink-400 text-white shadow-md shadow-magenta-900/30'
                    : 'text-navy-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                    isActive ? 'bg-white/20' : 'bg-navy-500/60 group-hover:bg-white/10'
                  }`}>
                    <Icon size={16} />
                  </span>
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={13} className="opacity-60" />}
                </>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="relative z-10 mx-2 my-3 h-px bg-gradient-to-r from-transparent via-navy-400 to-transparent" />
              <p className="px-3 py-1 text-[10px] font-bold text-navy-400 uppercase tracking-widest">Admin</p>
              {adminItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-magenta-500 to-pink-400 text-white shadow-md shadow-magenta-900/30'
                        : 'text-navy-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        isActive ? 'bg-white/20' : 'bg-navy-500/60 group-hover:bg-white/10'
                      }`}>
                        <Icon size={16} />
                      </span>
                      <span className="flex-1">{label}</span>
                      {isActive && <ChevronRight size={13} className="opacity-60" />}
                    </>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* ── User footer ── */}
        <div className="relative z-10 mx-3 mb-4">
          <div className="bg-navy-500/50 rounded-2xl p-3 backdrop-blur-sm border border-navy-400/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-magenta-500 to-pink-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate leading-tight">{user?.name}</p>
                <p className="text-navy-300 text-xs capitalize mt-0.5">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-navy-300 hover:bg-white/10 hover:text-white transition-all duration-150"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Mobile top header ── */}
        <header className="md:hidden relative flex items-center justify-between px-4 py-3 bg-navy-600 flex-shrink-0 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-magenta-500 to-pink-400 rounded-xl flex items-center justify-center shadow-md">
              <Gem size={15} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Pearl Isle Capital</p>
              <p className="text-navy-300 text-[10px]">Pawn Manager</p>
            </div>
          </div>
          <div className="relative z-10 w-8 h-8 rounded-xl bg-gradient-to-br from-magenta-500 to-pink-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* ── Mobile bottom tab bar ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy-600 border-t border-navy-500 z-40">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }}
          />
          <div className="relative z-10 flex items-stretch">
            {allBottomItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-2.5 gap-0.5 text-[10px] font-medium transition-all min-w-0 ${
                    isActive ? 'text-white' : 'text-navy-300 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`p-1.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-magenta-500 to-pink-400 shadow-md shadow-magenta-900/40'
                        : ''
                    }`}>
                      <Icon size={18} />
                    </span>
                    <span className="truncate w-full text-center px-0.5">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
