import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Package, CheckCircle, Calendar, Scale, Tag, ChevronDown, CreditCard, ExternalLink, Upload } from 'lucide-react'
import { getItems, createItem } from '../api/item.api'
import { getCustomers } from '../api/customer.api'
import { Item } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import CustomerAvatar from '../components/ui/CustomerAvatar'
import WeightBadge from '../components/ui/WeightBadge'
import BarcodeDisplay from '../components/ui/BarcodeDisplay'
import Drawer from '../components/ui/Drawer'
import CSVImportModal from '../components/ui/CSVImportModal'

const ITEM_TYPES = ['ring', 'chain', 'bracelet', 'earrings', 'necklace', 'bangle', 'pendant', 'other']

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

export default function Items() {
  const navigate   = useNavigate()
  const qc         = useQueryClient()
  const [status, setStatus]           = useState<'ACTIVE' | 'RELEASED' | ''>('')
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [page, setPage]               = useState(1)
  const [showDrawer, setShowDrawer]   = useState(false)
  const [showImport, setShowImport]   = useState(false)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [createdItem, setCreatedItem] = useState<Item | null>(null)
  const [formError, setFormError]     = useState('')
  const [form, setForm] = useState({
    customerId: '',
    itemType: '',
    weight: '',
    description: '',
    pawnDate: new Date().toISOString().split('T')[0]
  })

  const { data, isLoading } = useQuery({
    queryKey: ['items', status, page],
    queryFn: () => getItems({ status: status || undefined, page, limit: 18 })
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    enabled: showDrawer
  })

  const mutation = useMutation({
    mutationFn: () => createItem({
      customerId:  form.customerId,
      itemType:    form.itemType,
      weight:      parseFloat(form.weight),
      description: form.description || undefined,
      pawnDate:    new Date(form.pawnDate).toISOString()
    }),
    onSuccess: item => {
      setCreatedItem(item)
      qc.invalidateQueries({ queryKey: ['items'] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to pawn item'
      setFormError(msg)
    }
  })

  const resetForm = () => {
    setForm({ customerId: '', itemType: '', weight: '', description: '', pawnDate: new Date().toISOString().split('T')[0] })
    setCreatedItem(null)
    setFormError('')
  }

  const openDrawer = () => { resetForm(); setShowDrawer(true) }
  const closeDrawer = () => { setShowDrawer(false); setTimeout(resetForm, 300) }

  const items      = data?.items ?? []
  const pagination = data?.pagination
  const filtered   = barcodeSearch
    ? items.filter(i => i.barcode.toLowerCase().includes(barcodeSearch.toLowerCase()))
    : items

  const selectedCustomer = customers.find(c => c.id === form.customerId)

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">Items</h1>
          {pagination && (
            <p className="text-gray-400 text-sm mt-0.5">
              {pagination.total} item{pagination.total !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary gap-2" onClick={() => setShowImport(true)}>
            <Upload size={15} />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button className="btn-primary" onClick={openDrawer}>
            <Plus size={16} />
            <span className="hidden sm:inline">Pawn Item</span>
            <span className="sm:hidden">Pawn</span>
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10 bg-white shadow-sm"
            placeholder="Filter by barcode…"
            value={barcodeSearch}
            onChange={e => setBarcodeSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
          {(['', 'ACTIVE', 'RELEASED'] as const).map(s => (
            <button key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                status === s
                  ? 'bg-navy-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-navy-600'
              }`}>
              {s === '' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Items table ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title={barcodeSearch ? 'No items match that barcode' : 'No items found'} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">

                {/* ── Header ── */}
                <thead>
                  <tr className="bg-gradient-to-r from-navy-600 to-navy-500">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Ticket ID</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Weight</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Pawn Date</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>

                {/* ── Body ── */}
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(item => {
                    const isExpanded = expandedItemId === item.id
                    return (
                      <>
                        <tr
                          key={item.id}
                          onClick={() => navigate(`/items/${item.id}`)}
                          className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-gradient-to-r from-navy-50 to-blue-50' : 'hover:bg-gradient-to-r hover:from-navy-50 hover:to-blue-50'}`}
                        >
                          {/* Customer */}
                          <td className="px-5 py-4">
                            {item.customer ? (
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  setExpandedItemId(isExpanded ? null : item.id)
                                }}
                                className="flex items-center gap-2 group/cust"
                              >
                                <CustomerAvatar name={item.customer.name} size="xs" />
                                <span className="font-medium text-gray-800 group-hover/cust:text-navy-700 transition-colors">
                                  {item.customer.name}
                                </span>
                                <ChevronDown
                                  size={13}
                                  className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-navy-500' : ''}`}
                                />
                              </button>
                            ) : <span className="text-gray-300">—</span>}
                          </td>

                          {/* Ticket ID */}
                          <td className="px-5 py-4">
                            <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded tracking-tight">
                              {item.description?.match(/Ticket No:\s*(\S+)/)?.[1] ?? item.barcode}
                            </span>
                          </td>

                          {/* Type */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${typeColor[item.itemType] ?? typeColor.other}`}>
                              {item.itemType}
                            </span>
                          </td>

                          {/* Weight */}
                          <td className="px-5 py-4">
                            <WeightBadge weight={item.weight} size="sm" />
                          </td>

                          {/* Date */}
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                              <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                              {new Date(item.pawnDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.status === 'ACTIVE'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-sm'
                                : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.status === 'ACTIVE' ? 'bg-white/70' : 'bg-gray-400'}`} />
                              {item.status}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded customer detail row */}
                        {isExpanded && item.customer && (
                          <tr key={`${item.id}-expanded`} className="bg-gradient-to-r from-navy-50/60 to-blue-50/60">
                            <td colSpan={6} className="px-5 py-0">
                              <div className="py-3 pl-2">
                                <div className="flex items-center justify-between bg-white border border-navy-100 rounded-2xl px-5 py-4 shadow-sm max-w-lg">
                                  {/* Left: avatar + info */}
                                  <div className="flex items-center gap-4">
                                    <CustomerAvatar name={item.customer.name} size="md" />
                                    <div className="space-y-1">
                                      <p className="font-semibold text-navy-700 text-sm leading-none">{item.customer.name}</p>
                                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
                                        <CreditCard size={10} className="text-gray-400" />
                                        {item.customer.nic}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right: action */}
                                  <button
                                    onClick={e => { e.stopPropagation(); navigate(`/customers/${item.customer!.id}`) }}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-800 bg-navy-50 hover:bg-navy-100 border border-navy-200 px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    <ExternalLink size={11} />
                                    View Profile
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
                <span>
                  Page <span className="font-semibold text-navy-700">{pagination.page}</span> of {pagination.totalPages}
                  <span className="ml-2 text-xs text-gray-400">({pagination.total} items)</span>
                </span>
                <div className="flex gap-2">
                  <button className="btn-secondary py-1 px-3 text-xs"
                    disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <button className="btn-secondary py-1 px-3 text-xs"
                    disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CSV Import Modal ─────────────────────────────────────────── */}
      <CSVImportModal open={showImport} onClose={() => setShowImport(false)} />

      {/* ── Pawn Item Drawer ─────────────────────────────────────────── */}
      <Drawer
        open={showDrawer}
        onClose={closeDrawer}
        title={createdItem ? 'Item Pawned!' : 'Pawn New Item'}
        subtitle={createdItem ? 'Barcode generated successfully' : 'Fill in the details to register a new item'}
      >
        {createdItem ? (
          /* ── Success state ── */
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-full flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-navy-700 text-lg">Successfully Pawned</p>
                <p className="text-gray-400 text-sm">Barcode has been generated</p>
              </div>
            </div>

            {/* Barcode */}
            <div className="bg-gradient-to-br from-navy-50 to-blue-50 rounded-2xl border border-navy-100 p-4 flex flex-col items-center gap-3">
              <BarcodeDisplay value={createdItem.barcode} showPrint
                label={selectedCustomer ? `${selectedCustomer.name} · ${createdItem.itemType}` : createdItem.itemType}
                ticketNo={createdItem.description?.match(/Ticket No:\s*(\S+)/)?.[1]}
              />
            </div>

            {/* Item summary */}
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 text-sm overflow-hidden">
              {selectedCustomer && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <CustomerAvatar name={selectedCustomer.name} size="sm" />
                  <div>
                    <p className="text-xs text-gray-400">Customer</p>
                    <p className="font-semibold text-navy-700">{selectedCustomer.name}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2">
                <div className="px-4 py-3 flex items-center gap-2">
                  <Tag size={13} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Type</p>
                    <p className="font-medium capitalize">{createdItem.itemType}</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center gap-2 border-l border-gray-100">
                  <Scale size={13} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Weight</p>
                    <WeightBadge weight={createdItem.weight} size="sm" />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center gap-2">
                <Calendar size={13} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Pawn Date</p>
                  <p className="font-medium">{new Date(createdItem.pawnDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button className="btn-primary w-full justify-center py-3" onClick={resetForm}>
                <Plus size={15} /> Pawn Another Item
              </button>
              <button className="btn-secondary w-full justify-center py-2.5"
                onClick={() => { closeDrawer(); navigate(`/items/${createdItem.id}`) }}>
                View Item Detail
              </button>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={e => { e.preventDefault(); setFormError(''); mutation.mutate() }} className="space-y-6">
            {formError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {formError}
              </div>
            )}

            {/* Customer */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Customer</p>
              {selectedCustomer && (
                <div className="flex items-center gap-3 p-3 mb-3 bg-gradient-to-br from-navy-50 to-blue-50 rounded-xl border border-navy-100">
                  <CustomerAvatar name={selectedCustomer.name} size="md" />
                  <div>
                    <p className="font-semibold text-navy-700 text-sm">{selectedCustomer.name}</p>
                    <p className="font-mono text-xs text-gray-400">{selectedCustomer.nic}</p>
                  </div>
                </div>
              )}
              <label className="label">Select Customer <span className="text-red-400">*</span></label>
              <select
                className="input"
                required
                value={form.customerId}
                onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}
              >
                <option value="">— Choose a customer —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} · {c.nic}</option>
                ))}
              </select>
            </div>

            {/* Item type */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Item Details</p>
              <label className="label">Item Type <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {ITEM_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, itemType: t }))}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all capitalize ${
                      form.itemType === t
                        ? 'bg-navy-600 text-white border-navy-600 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-navy-300 hover:text-navy-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="label">Weight (g) <span className="text-red-400">*</span></label>
              <div className="relative">
                <Scale size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9 pr-8"
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  placeholder="0.000"
                  value={form.weight}
                  onChange={e => setForm(p => ({ ...p, weight: e.target.value }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">g</span>
              </div>
              {form.weight && !isNaN(parseFloat(form.weight)) && (
                <div className="mt-2">
                  <WeightBadge weight={form.weight} size="sm" />
                </div>
              )}
            </div>

            {/* Pawn date */}
            <div>
              <label className="label">Pawn Date <span className="text-red-400">*</span></label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9"
                  type="date"
                  required
                  value={form.pawnDate}
                  onChange={e => setForm(p => ({ ...p, pawnDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label">Description <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
              <textarea
                className="input resize-none"
                rows={2}
                placeholder="Any notes about this item…"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="btn-primary w-full justify-center py-3 text-base"
                disabled={mutation.isPending || !form.customerId || !form.itemType}
              >
                {mutation.isPending ? 'Generating barcode…' : 'Pawn Item & Generate Barcode'}
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
