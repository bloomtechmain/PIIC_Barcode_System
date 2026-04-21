import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, RefreshCw, Activity, User, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { getActivityLogs, ActivityLogFilter } from '../api/activity-log.api'
import { ActivityLog } from '../types'

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-emerald-100 text-emerald-700',
  LOGOUT: 'bg-slate-100 text-slate-600',
  CREATE: 'bg-blue-100 text-blue-700',
  UPDATE: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  RELEASE: 'bg-purple-100 text-purple-700',
}

function actionBadge(action: string) {
  const cls = ACTION_COLORS[action] ?? 'bg-navy-100 text-navy-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${cls}`}>
      {action}
    </span>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [entity, setEntity] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const filter: ActivityLogFilter = { page, limit: 25 }
      if (search) filter.search = search
      if (action) filter.action = action
      if (entity) filter.entity = entity
      if (dateFrom) filter.dateFrom = dateFrom
      if (dateTo) filter.dateTo = dateTo

      const res = await getActivityLogs(filter)
      setLogs(res.data.data.items)
      setTotal(res.data.data.pagination.total)
      setTotalPages(res.data.data.pagination.totalPages)
    } catch {
      // handled by axios interceptor
    } finally {
      setLoading(false)
    }
  }, [page, search, action, entity, dateFrom, dateTo])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  const handleReset = () => {
    setSearch(''); setAction(''); setEntity(''); setDateFrom(''); setDateTo('')
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-800 flex items-center gap-2">
            <Activity size={22} className="text-magenta-500" />
            Activity Logs
          </h1>
          <p className="text-sm text-navy-400 mt-0.5">{total.toLocaleString()} total entries</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-navy-500 border border-navy-200 hover:border-navy-300 hover:text-navy-700 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilterSubmit} className="bg-white rounded-2xl border border-navy-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-navy-400" />
          <span className="text-xs font-semibold text-navy-400 uppercase tracking-widest">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search user…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-navy-200 rounded-xl focus:outline-none focus:border-magenta-400"
            />
          </div>
          <input
            type="text"
            placeholder="Action (e.g. LOGIN)"
            value={action}
            onChange={e => setAction(e.target.value.toUpperCase())}
            className="px-3 py-2 text-sm border border-navy-200 rounded-xl focus:outline-none focus:border-magenta-400"
          />
          <input
            type="text"
            placeholder="Entity (e.g. Item)"
            value={entity}
            onChange={e => setEntity(e.target.value)}
            className="px-3 py-2 text-sm border border-navy-200 rounded-xl focus:outline-none focus:border-magenta-400"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-navy-200 rounded-xl focus:outline-none focus:border-magenta-400"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 text-sm border border-navy-200 rounded-xl focus:outline-none focus:border-magenta-400"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            type="submit"
            className="px-4 py-2 bg-magenta-500 hover:bg-magenta-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-navy-200 hover:border-navy-300 text-navy-600 text-sm font-medium rounded-xl transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50">
                <th className="text-left px-4 py-3 font-semibold text-navy-500 text-xs uppercase tracking-wide whitespace-nowrap">Time</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-500 text-xs uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-500 text-xs uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-500 text-xs uppercase tracking-wide">Entity</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-500 text-xs uppercase tracking-wide">Details</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-500 text-xs uppercase tracking-wide">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-navy-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                    Loading…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-navy-400">
                    <Activity size={32} className="mx-auto mb-2 opacity-30" />
                    No activity logs found
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-navy-50/40 transition-colors">
                    <td className="px-4 py-3 text-navy-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-navy-300 flex-shrink-0" />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-magenta-500 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {log.user.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-navy-700 leading-tight">{log.user.name}</p>
                            <p className="text-xs text-navy-400">{log.user.role.toLowerCase()}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-navy-400">
                          <User size={12} />
                          <span className="text-xs italic">System</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{actionBadge(log.action)}</td>
                    <td className="px-4 py-3 text-navy-600">
                      {log.entity ? (
                        <span className="font-mono text-xs bg-navy-50 px-2 py-0.5 rounded">
                          {log.entity}{log.entityId ? ` #${log.entityId.slice(-6)}` : ''}
                        </span>
                      ) : (
                        <span className="text-navy-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {log.details ? (
                        <span className="font-mono text-xs text-navy-500 truncate block max-w-xs">
                          {JSON.stringify(log.details)}
                        </span>
                      ) : (
                        <span className="text-navy-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-navy-400 font-mono text-xs">
                      {log.ip ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy-100 bg-navy-50/30">
            <p className="text-xs text-navy-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-navy-200 text-navy-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-navy-200 text-navy-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
