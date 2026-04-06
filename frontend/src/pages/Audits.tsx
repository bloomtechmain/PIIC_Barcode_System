import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus, ClipboardCheck, CheckCircle,
  Calendar, FileText, ChevronRight, Scan, Package, Hash
} from 'lucide-react'
import { getAudits, createAudit } from '../api/audit.api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import Drawer from '../components/ui/Drawer'
import { useAuth } from '../context/AuthContext'

export default function Audits() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAdmin } = useAuth()
  const [showDrawer, setShowDrawer] = useState(false)
  const [notes, setNotes]           = useState('')
  const [formError, setFormError]   = useState('')

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: getAudits
  })

  const mutation = useMutation({
    mutationFn: () => createAudit({ notes: notes || undefined }),
    onSuccess: audit => {
      qc.invalidateQueries({ queryKey: ['audits'] })
      setShowDrawer(false)
      setNotes('')
      navigate(`/audits/${audit.id}`)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to create audit'
      setFormError(msg)
    }
  })

  const openDrawer  = () => { setFormError(''); setNotes(''); setShowDrawer(true) }
  const closeDrawer = () => { setShowDrawer(false); setFormError('') }

  const finalized   = audits.filter(a => !!a.finalizedAt).length
  const inProgress  = audits.filter(a => !a.finalizedAt).length

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">Audits</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {audits.length} total · {finalized} finalized · {inProgress} in progress
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openDrawer}>
            <Plus size={16} />
            <span className="hidden sm:inline">New Audit</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      {/* ── Summary tiles ───────────────────────────────────────────── */}
      {audits.length > 0 && (
        <div className="grid grid-cols-3 gap-4">

          {/* Total */}
          <div className="relative bg-gradient-to-br from-navy-600 to-navy-400 rounded-2xl shadow-md shadow-navy-200 px-5 py-5 text-center overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/10" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
            <p className="relative z-10 text-3xl font-bold text-white">{audits.length}</p>
            <p className="relative z-10 text-xs text-navy-200 mt-1.5 font-medium uppercase tracking-wide">Total Audits</p>
          </div>

          {/* Finalized */}
          <div className="relative bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl shadow-md shadow-emerald-200 px-5 py-5 text-center overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/10" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
            <p className="relative z-10 text-3xl font-bold text-white">{finalized}</p>
            <p className="relative z-10 text-xs text-emerald-100 mt-1.5 font-medium uppercase tracking-wide">Finalized</p>
          </div>

          {/* In Progress */}
          <div className="relative bg-gradient-to-br from-magenta-500 to-pink-400 rounded-2xl shadow-md shadow-magenta-200 px-5 py-5 text-center overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/10" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
            <p className="relative z-10 text-3xl font-bold text-white">{inProgress}</p>
            <p className="relative z-10 text-xs text-pink-100 mt-1.5 font-medium uppercase tracking-wide">In Progress</p>
          </div>

        </div>
      )}

      {/* ── Audits table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {audits.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No audits yet"
            description="Start an audit to scan and verify all items in the vault." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">

              {/* ── Header ── */}
              <thead>
                <tr className="bg-gradient-to-r from-navy-600 to-navy-500">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Created By</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-navy-100 uppercase tracking-wider">Items at Time</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-navy-100 uppercase tracking-wider">Scanned</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>

              {/* ── Body ── */}
              <tbody className="divide-y divide-gray-100">
                {audits.map(a => {
                  const scanned   = a._count?.auditItems ?? 0
                  const coverage  = a.totalItemsAtTime > 0
                    ? Math.round((scanned / a.totalItemsAtTime) * 100)
                    : 0

                  return (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/audits/${a.id}`)}
                      className="group cursor-pointer hover:bg-gradient-to-r hover:from-navy-50 hover:to-blue-50 transition-colors"
                    >
                      {/* Date */}
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-gray-700 font-medium text-xs">
                          <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                          {new Date(a.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[11px] text-gray-400 ml-5">
                          {new Date(a.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Created by */}
                      <td className="px-5 py-4">
                        {a.createdBy?.name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {a.createdBy.name[0].toUpperCase()}
                            </div>
                            <span className="text-gray-600 text-xs">{a.createdBy.name}</span>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Items at time */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-navy-700 bg-navy-50 group-hover:bg-white border border-navy-100 px-2.5 py-0.5 rounded-lg text-xs transition-colors">
                          <Package size={11} />
                          {a.totalItemsAtTime}
                        </span>
                      </td>

                      {/* Scanned + coverage bar */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold text-gray-700 text-xs">{scanned}</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                coverage === 100
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : coverage > 50
                                  ? 'bg-gradient-to-r from-navy-500 to-blue-400'
                                  : 'bg-gradient-to-r from-magenta-500 to-pink-400'
                              }`}
                              style={{ width: `${coverage}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">{coverage}%</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {a.finalizedAt ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
                            Finalized
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-magenta-500 to-pink-400 text-white shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse flex-shrink-0" />
                            In Progress
                          </span>
                        )}
                        {a.finalizedAt && (
                          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar size={9} />
                            {new Date(a.finalizedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </td>

                      {/* Arrow */}
                      <td className="px-4 py-4">
                        <ChevronRight size={15} className="text-gray-300 group-hover:text-magenta-500 transition-colors" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── New Audit Drawer ─────────────────────────────────────────── */}
      <Drawer
        open={showDrawer}
        onClose={closeDrawer}
        title="Start New Audit"
        subtitle="A snapshot of current active items will be taken"
      >
        <div className="space-y-6">
          {formError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {formError}
            </div>
          )}

          {/* Info banner */}
          <div className="bg-gradient-to-br from-navy-50 to-blue-50 border border-navy-100 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-navy-700 flex items-center gap-2">
              <Scan size={15} className="text-magenta-500" />
              How it works
            </p>
            <div className="space-y-2">
              {[
                { icon: Hash,          text: 'Active item count is snapshotted at creation time' },
                { icon: Scan,          text: 'Scan barcodes to mark items as Found or Missing' },
                { icon: CheckCircle,   text: 'Finalize to lock results and generate a report' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2.5 text-xs text-navy-600">
                  <div className="w-5 h-5 bg-navy-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={11} className="text-navy-600" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Session Notes
            </p>
            <label className="label">
              Notes <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                className="input pl-9 resize-none"
                rows={3}
                placeholder="e.g. Monthly vault audit, Q2 check…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <button
              className="btn-primary w-full justify-center py-3 text-base"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creating…' : 'Start Audit Session'}
            </button>
            <button className="btn-secondary w-full justify-center py-2.5" onClick={closeDrawer}>
              Cancel
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
