import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ArrowUpFromLine, CheckCircle, Tag, FileText, Search, Calendar } from 'lucide-react'
import { getReleases, createRelease } from '../api/release.api'
import { getItems } from '../api/item.api'
import { Item } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import CustomerAvatar from '../components/ui/CustomerAvatar'
import WeightBadge from '../components/ui/WeightBadge'
import Drawer from '../components/ui/Drawer'

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

export default function Releases() {
  const qc = useQueryClient()
  const [showDrawer, setShowDrawer] = useState(false)
  const [released, setReleased]     = useState<Item | null>(null)
  const [form, setForm]             = useState({ itemId: '', notes: '' })
  const [formError, setFormError]   = useState('')
  const [itemSearch, setItemSearch] = useState('')

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['releases'],
    queryFn: getReleases
  })

  const { data: activeItems } = useQuery({
    queryKey: ['items', 'ACTIVE', 1],
    queryFn: () => getItems({ status: 'ACTIVE', limit: 200 }),
    enabled: showDrawer
  })

  const mutation = useMutation({
    mutationFn: createRelease,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['releases'] })
      qc.invalidateQueries({ queryKey: ['items'] })
      const item = activeItems?.items.find(i => i.id === vars.itemId) ?? null
      setReleased(item)
      setFormError('')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to release item'
      setFormError(msg)
    }
  })

  const resetForm = () => {
    setForm({ itemId: '', notes: '' })
    setReleased(null)
    setFormError('')
    setItemSearch('')
  }

  const openDrawer  = () => { resetForm(); setShowDrawer(true) }
  const closeDrawer = () => { setShowDrawer(false); setTimeout(resetForm, 300) }

  const filteredItems = (activeItems?.items ?? []).filter(i => {
    const q = itemSearch.toLowerCase()
    return (
      i.barcode.toLowerCase().includes(q) ||
      i.itemType.toLowerCase().includes(q) ||
      (i.customer?.name ?? '').toLowerCase().includes(q)
    )
  })

  const selectedItem = activeItems?.items.find(i => i.id === form.itemId) ?? null

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">

      {/* ── Page header ────────────────��────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">Releases</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {releases.length} release{releases.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn-primary" onClick={openDrawer}>
          <Plus size={16} />
          <span className="hidden sm:inline">Release Item</span>
          <span className="sm:hidden">Release</span>
        </button>
      </div>

      {/* ── Releases table ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {releases.length === 0 ? (
          <EmptyState icon={ArrowUpFromLine} title="No releases yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">

              {/* ── Header ── */}
              <thead>
                <tr className="bg-gradient-to-r from-navy-600 to-navy-500">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Barcode</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Released By</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Release Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>

              {/* ── Body ── */}
              <tbody className="divide-y divide-gray-100">
                {releases.map(r => (
                  <tr key={r.id} className="group hover:bg-gradient-to-r hover:from-navy-50 hover:to-blue-50 transition-colors">

                    {/* Barcode */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center font-mono text-xs font-bold text-navy-700 bg-navy-50 group-hover:bg-white border border-navy-100 px-2.5 py-1 rounded-lg tracking-wider transition-colors">
                        {r.item?.barcode ?? '—'}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">
                      {r.item?.customer?.name ? (
                        <div className="flex items-center gap-2.5">
                          <CustomerAvatar name={r.item.customer.name} size="xs" />
                          <span className="font-medium text-gray-800">{r.item.customer.name}</span>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
                      {r.item?.itemType ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${typeColor[r.item.itemType] ?? typeColor.other}`}>
                          {r.item.itemType}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Released by */}
                    <td className="px-5 py-4">
                      {r.releasedBy?.name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {r.releasedBy.name[0].toUpperCase()}
                          </div>
                          <span className="text-gray-600 text-xs">{r.releasedBy.name}</span>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                        {new Date(r.releaseDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-4">
                      {r.notes ? (
                        <span className="text-xs text-gray-500 italic bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md max-w-[140px] truncate block">
                          "{r.notes}"
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Release Item Drawer ───────────────────────────────��──────── */}
      <Drawer
        open={showDrawer}
        onClose={closeDrawer}
        title={released ? 'Item Released!' : 'Release Item'}
        subtitle={released ? 'The item has been returned to the customer' : 'Select an active item to release back to its owner'}
      >
        {released ? (
          /* ── Success state ── */
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-full flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-navy-700 text-lg">Released Successfully</p>
                <p className="text-gray-400 text-sm">Item has been marked as released</p>
              </div>
            </div>

            {/* Released item summary */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 divide-y divide-emerald-100 text-sm overflow-hidden">
              {released.customer && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <CustomerAvatar name={released.customer.name} size="sm" />
                  <div>
                    <p className="text-xs text-emerald-500">Customer</p>
                    <p className="font-semibold text-emerald-800">{released.customer.name}</p>
                  </div>
                </div>
              )}
              <div className="px-4 py-3">
                <p className="text-xs text-emerald-500 mb-0.5">Barcode</p>
                <p className="font-mono font-bold text-emerald-800 tracking-wider">{released.barcode}</p>
              </div>
              <div className="grid grid-cols-2">
                <div className="px-4 py-3">
                  <p className="text-xs text-emerald-500">Type</p>
                  <p className="font-semibold text-emerald-800 capitalize">{released.itemType}</p>
                </div>
                <div className="px-4 py-3 border-l border-emerald-100">
                  <p className="text-xs text-emerald-500 mb-0.5">Weight</p>
                  <WeightBadge weight={released.weight} size="sm" />
                </div>
              </div>
              {form.notes && (
                <div className="px-4 py-3">
                  <p className="text-xs text-emerald-500">Notes</p>
                  <p className="text-emerald-800 italic">"{form.notes}"</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button className="btn-primary w-full justify-center py-3" onClick={resetForm}>
                <Plus size={15} /> Release Another Item
              </button>
              <button className="btn-secondary w-full justify-center py-2.5" onClick={closeDrawer}>
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={e => { e.preventDefault(); mutation.mutate(form) }} className="space-y-6">
            {formError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {formError}
              </div>
            )}

            {/* Item selection */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Select Item
              </p>

              {/* Search */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9 text-sm"
                  placeholder="Search by barcode, type or customer…"
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                />
              </div>

              {/* Selected item preview */}
              {selectedItem && (
                <div className="flex items-center gap-3 p-3 mb-3 bg-gradient-to-br from-navy-50 to-blue-50 rounded-xl border border-navy-100">
                  <div className="w-9 h-9 bg-navy-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Tag size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-bold text-navy-700 truncate">{selectedItem.barcode}</p>
                    {selectedItem.customer && (
                      <p className="text-xs text-gray-500 truncate">{selectedItem.customer.name}</p>
                    )}
                  </div>
                  <WeightBadge weight={selectedItem.weight} size="sm" />
                </div>
              )}

              {/* Item list */}
              <div className="rounded-xl border border-gray-200 overflow-hidden max-h-52 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-400 text-center">
                    {activeItems ? 'No active items found' : 'Loading…'}
                  </p>
                ) : (
                  filteredItems.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, itemId: item.id }))}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm border-b border-gray-100 last:border-0 transition-colors ${
                        form.itemId === item.id
                          ? 'bg-navy-600 text-white'
                          : 'hover:bg-navy-50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        form.itemId === item.id ? 'bg-white/20' : 'bg-navy-50'
                      }`}>
                        <Tag size={13} className={form.itemId === item.id ? 'text-white' : 'text-navy-600'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-mono text-xs font-bold truncate ${form.itemId === item.id ? 'text-white' : 'text-navy-700'}`}>
                          {item.barcode}
                        </p>
                        <p className={`text-xs truncate capitalize ${form.itemId === item.id ? 'text-white/70' : 'text-gray-400'}`}>
                          {item.itemType}{item.customer ? ` · ${item.customer.name}` : ''}
                        </p>
                      </div>
                      <WeightBadge weight={item.weight} size="sm" />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Additional Info
              </p>
              <label className="label">
                Notes <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <div className="relative">
                <FileText size={14} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  className="input pl-9 resize-none"
                  rows={3}
                  placeholder="Reason for release, customer request, etc."
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="btn-primary w-full justify-center py-3 text-base"
                disabled={mutation.isPending || !form.itemId}
              >
                {mutation.isPending ? 'Releasing…' : 'Confirm Release'}
              </button>
              <button type="button" className="btn-secondary w-full justify-center py-2.5" onClick={closeDrawer}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  )
}
