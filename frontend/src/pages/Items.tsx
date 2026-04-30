import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Package, CheckCircle, Calendar, Scale,
  ExternalLink, Upload, ChevronRight, Pencil, X, Save
} from 'lucide-react'
import { getItems, createItem, updateItem } from '../api/item.api'
import { getCustomers } from '../api/customer.api'
import { Item } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import CustomerAvatar from '../components/ui/CustomerAvatar'
import WeightBadge from '../components/ui/WeightBadge'
import BarcodeDisplay from '../components/ui/BarcodeDisplay'
import Drawer from '../components/ui/Drawer'
import CSVImportModal from '../components/ui/CSVImportModal'
import { useAuth } from '../context/AuthContext'

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

interface TicketGroup {
  key: string
  ticketNo: string
  customer: Item['customer']
  pawnDate: string
  items: Item[]
}

function getTicketNo(item: Item): string {
  if (item.ticketNo) return item.ticketNo
  const m = item.description?.match(/Ticket No:\s*([^\s|]+)/)
  return m ? m[1].trim() : item.barcode
}

function groupByTicket(items: Item[]): TicketGroup[] {
  const map = new Map<string, TicketGroup>()
  for (const item of items) {
    const key = getTicketNo(item)
    if (!map.has(key)) {
      map.set(key, { key, ticketNo: key, customer: item.customer, pawnDate: item.pawnDate, items: [] })
    }
    map.get(key)!.items.push(item)
  }
  return Array.from(map.values())
}

interface EditState {
  itemType: string; weight: string; grossWeight: string; karatage: string; remarks: string
}

export default function Items() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAdmin, isSuperAdmin } = useAuth()
  const canEdit = isAdmin || isSuperAdmin

  const [status, setStatus]               = useState<'ACTIVE' | 'RELEASED' | ''>('')
  const [search, setSearch]               = useState('')
  const [page, setPage]                   = useState(1)
  const [showDrawer, setShowDrawer]       = useState(false)
  const [showImport, setShowImport]       = useState(false)
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())
  const [expandedItems, setExpandedItems]     = useState<Set<string>>(new Set())
  const [editingItemId, setEditingItemId]     = useState<string | null>(null)
  const [editForm, setEditForm]           = useState<EditState>({ itemType: '', weight: '', grossWeight: '', karatage: '', remarks: '' })
  const [editError, setEditError]         = useState('')
  const [createdItem, setCreatedItem]     = useState<Item | null>(null)
  const [formError, setFormError]         = useState('')
  const [form, setForm] = useState({ customerId: '', itemType: '', weight: '', description: '', pawnDate: new Date().toISOString().split('T')[0] })

  const { data, isLoading } = useQuery({
    queryKey: ['items', status, page],
    queryFn: () => getItems({ status: status || undefined, page, limit: 50 })
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    enabled: showDrawer
  })

  const createMutation = useMutation({
    mutationFn: () => createItem({ customerId: form.customerId, itemType: form.itemType, weight: parseFloat(form.weight), description: form.description || undefined, pawnDate: new Date(form.pawnDate).toISOString() }),
    onSuccess: item => { setCreatedItem(item); qc.invalidateQueries({ queryKey: ['items'] }) },
    onError: (err: unknown) => {
      setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to pawn item')
    }
  })

  const editMutation = useMutation({
    mutationFn: (id: string) => updateItem(id, {
      itemType:    editForm.itemType    || undefined,
      weight:      editForm.weight      ? parseFloat(editForm.weight)      : undefined,
      grossWeight: editForm.grossWeight ? parseFloat(editForm.grossWeight) : null,
      karatage:    editForm.karatage    ? parseInt(editForm.karatage, 10)  : null,
      remarks:     editForm.remarks     || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] })
      setEditingItemId(null)
      setEditError('')
    },
    onError: (err: unknown) => {
      setEditError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save')
    }
  })

  const resetForm = () => { setForm({ customerId: '', itemType: '', weight: '', description: '', pawnDate: new Date().toISOString().split('T')[0] }); setCreatedItem(null); setFormError('') }
  const openDrawer  = () => { resetForm(); setShowDrawer(true) }
  const closeDrawer = () => { setShowDrawer(false); setTimeout(resetForm, 300) }

  const toggleTicket = (key: string) => setExpandedTickets(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  const toggleItem   = (id: string)  => setExpandedItems(prev  => { const n = new Set(prev); n.has(id)  ? n.delete(id)  : n.add(id);  return n })

  const openEdit = (item: Item) => {
    setEditForm({
      itemType:    item.itemType,
      weight:      String(item.weight),
      grossWeight: item.grossWeight ? String(item.grossWeight) : '',
      karatage:    item.karatage    ? String(item.karatage)    : '',
      remarks:     item.remarks     ?? '',
    })
    setEditError('')
    setEditingItemId(item.id)
    // also expand the item so the edit form is visible
    setExpandedItems(prev => { const n = new Set(prev); n.add(item.id); return n })
  }

  const allItems   = data?.items ?? []
  const pagination = data?.pagination
  const filtered   = allItems.filter(i =>
    !search ||
    getTicketNo(i).toLowerCase().includes(search.toLowerCase()) ||
    i.barcode.toLowerCase().includes(search.toLowerCase()) ||
    (i.customer?.name ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const groups = groupByTicket(filtered)
  const selectedCustomer = customers.find(c => c.id === form.customerId)

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">Items</h1>
          {pagination && <p className="text-gray-400 text-sm mt-0.5">{pagination.total} item{pagination.total !== 1 ? 's' : ''} · {groups.length} ticket{groups.length !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary gap-2" onClick={() => setShowImport(true)}><Upload size={15} /><span className="hidden sm:inline">Import CSV</span></button>
          <button className="btn-primary" onClick={openDrawer}><Plus size={16} /><span className="hidden sm:inline">Pawn Item</span><span className="sm:hidden">Pawn</span></button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10 bg-white shadow-sm" placeholder="Search by ticket no, barcode or customer…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
          {(['', 'ACTIVE', 'RELEASED'] as const).map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${status === s ? 'bg-navy-600 text-white shadow-sm' : 'text-gray-500 hover:text-navy-600'}`}>
              {s === '' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {groups.length === 0 ? (
          <EmptyState icon={Package} title={search ? 'No items match that search' : 'No items found'} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="bg-gradient-to-r from-navy-600 to-navy-500">
                    <th className="w-10" />
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Ticket No</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Pawn Date</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-navy-100 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(group => {
                    const ticketOpen  = expandedTickets.has(group.key)
                    const activeCount = group.items.filter(i => i.status === 'ACTIVE').length
                    const relCount    = group.items.length - activeCount

                    return (
                      <>
                        {/* ── Ticket group row ── */}
                        <tr key={group.key} onClick={() => toggleTicket(group.key)}
                          className={`cursor-pointer border-b border-gray-100 transition-colors select-none ${ticketOpen ? 'bg-navy-50' : 'hover:bg-gray-50'}`}>
                          <td className="pl-4 py-3.5">
                            <ChevronRight size={15} className={`text-gray-400 transition-transform duration-200 ${ticketOpen ? 'rotate-90 text-navy-500' : ''}`} />
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono text-xs font-semibold text-navy-700 bg-navy-50 border border-navy-100 px-2.5 py-1 rounded-lg">
                              {group.ticketNo}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {group.customer ? (
                              <div className="flex items-center gap-2">
                                <CustomerAvatar name={group.customer.name} size="xs" />
                                <div>
                                  <p className="font-medium text-gray-800 text-sm leading-tight">{group.customer.name}</p>
                                  <p className="font-mono text-[10px] text-gray-400">{group.customer.nic}</p>
                                </div>
                              </div>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                              {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                              <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                              {new Date(group.pawnDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1.5 flex-wrap">
                              {activeCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-white">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />{activeCount} Active
                                </span>
                              )}
                              {relCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />{relCount} Released
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* ── Items under this ticket ── */}
                        {ticketOpen && group.items.map((item, idx) => {
                          const itemOpen  = expandedItems.has(item.id)
                          const isEditing = editingItemId === item.id
                          const isLast    = idx === group.items.length - 1

                          return (
                            <>
                              {/* Item row */}
                              <tr key={item.id}
                                onClick={() => { if (!isEditing) toggleItem(item.id) }}
                                className={`border-b ${isLast && !itemOpen ? 'border-b-2 border-b-gray-200' : 'border-navy-50'} cursor-pointer transition-colors ${itemOpen ? 'bg-blue-50/60' : 'bg-navy-50/30 hover:bg-blue-50/40'}`}>
                                <td className="pl-6 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-px h-4 bg-navy-200" />
                                    <ChevronRight size={13} className={`text-navy-300 transition-transform duration-200 ${itemOpen ? 'rotate-90 text-navy-500' : ''}`} />
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-mono text-[10px] text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded">
                                    {item.barcode}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${typeColor[item.itemType] ?? typeColor.other}`}>
                                    {item.itemType}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <WeightBadge weight={item.weight} size="sm" />
                                    {item.grossWeight && <span className="text-xs text-gray-400">/{Number(item.grossWeight).toFixed(3)}g</span>}
                                    {item.karatage    && <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">{item.karatage}K</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {item.remarks
                                    ? <span className="text-xs text-gray-500 italic">{item.remarks}</span>
                                    : <span className="text-xs text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${item.status === 'ACTIVE' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.status === 'ACTIVE' ? 'bg-white/70' : 'bg-gray-400'}`} />
                                    {item.status}
                                  </span>
                                </td>
                              </tr>

                              {/* Expanded item detail + edit */}
                              {itemOpen && (
                                <tr key={`${item.id}-detail`} className={`${isLast ? 'border-b-2 border-b-gray-200' : 'border-b border-navy-50'} bg-white`}>
                                  <td colSpan={6} className="px-6 py-4 pl-12">
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">

                                      {/* Detail row */}
                                      <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                          <div className="text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Net Wt</p>
                                            <p className="font-bold text-gray-800 text-sm">{Number(item.weight).toFixed(3)}g</p>
                                          </div>
                                          {item.grossWeight && (
                                            <div className="text-center">
                                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Gross Wt</p>
                                              <p className="font-bold text-gray-800 text-sm">{Number(item.grossWeight).toFixed(3)}g</p>
                                            </div>
                                          )}
                                          {item.karatage && (
                                            <div className="text-center">
                                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Karatage</p>
                                              <p className="font-bold text-amber-600 text-sm">{item.karatage}K</p>
                                            </div>
                                          )}
                                          {item.remarks && (
                                            <div>
                                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Remarks</p>
                                              <p className="text-sm text-gray-700 italic">{item.remarks}</p>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button onClick={e => { e.stopPropagation(); navigate(`/items/${item.id}`) }}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-800 bg-white border border-navy-200 px-3 py-1.5 rounded-lg transition-all">
                                            <ExternalLink size={11} /> Full Detail
                                          </button>
                                          {canEdit && !isEditing && (
                                            <button onClick={e => { e.stopPropagation(); openEdit(item) }}
                                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-navy-600 hover:bg-navy-700 px-3 py-1.5 rounded-lg transition-all">
                                              <Pencil size={11} /> Edit
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Inline edit form */}
                                      {isEditing && (
                                        <div className="border-t border-gray-200 pt-4 space-y-4" onClick={e => e.stopPropagation()}>
                                          {editError && <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{editError}</div>}

                                          {/* Item type */}
                                          <div>
                                            <p className="label mb-2">Item Type</p>
                                            <div className="flex flex-wrap gap-1.5">
                                              {ITEM_TYPES.map(t => (
                                                <button key={t} type="button"
                                                  onClick={() => setEditForm(p => ({ ...p, itemType: t }))}
                                                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all capitalize ${editForm.itemType === t ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-500 border-gray-200 hover:border-navy-300'}`}>
                                                  {t}
                                                </button>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div>
                                              <label className="label">Net Weight (g)</label>
                                              <input className="input text-sm" type="number" step="0.001" min="0.001" placeholder="0.000"
                                                value={editForm.weight} onChange={e => setEditForm(p => ({ ...p, weight: e.target.value }))} />
                                            </div>
                                            <div>
                                              <label className="label">Gross Weight (g)</label>
                                              <input className="input text-sm" type="number" step="0.001" min="0.001" placeholder="0.000"
                                                value={editForm.grossWeight} onChange={e => setEditForm(p => ({ ...p, grossWeight: e.target.value }))} />
                                            </div>
                                            <div>
                                              <label className="label">Karatage (K)</label>
                                              <input className="input text-sm" type="number" min="1" max="24" placeholder="e.g. 22"
                                                value={editForm.karatage} onChange={e => setEditForm(p => ({ ...p, karatage: e.target.value }))} />
                                            </div>
                                            <div>
                                              <label className="label">Remarks</label>
                                              <input className="input text-sm" placeholder="Any remarks…"
                                                value={editForm.remarks} onChange={e => setEditForm(p => ({ ...p, remarks: e.target.value }))} />
                                            </div>
                                          </div>

                                          <div className="flex gap-2">
                                            <button onClick={() => editMutation.mutate(item.id)} disabled={editMutation.isPending}
                                              className="btn-primary gap-1.5 text-sm py-2">
                                              <Save size={13} />{editMutation.isPending ? 'Saving…' : 'Save'}
                                            </button>
                                            <button onClick={() => { setEditingItemId(null); setEditError('') }}
                                              className="btn-secondary gap-1.5 text-sm py-2">
                                              <X size={13} /> Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          )
                        })}

                        {/* Customer link row */}
                        {ticketOpen && group.customer && (
                          <tr key={`${group.key}-cust`} className="border-b-2 border-gray-200 bg-navy-50/20">
                            <td colSpan={6} className="px-6 py-2 pl-12">
                              <button onClick={e => { e.stopPropagation(); navigate(`/customers/${group.customer!.id}`) }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-800 bg-white border border-navy-200 px-3 py-1.5 rounded-lg transition-all">
                                <ExternalLink size={11} /> View {group.customer.name}'s Profile
                              </button>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
                <span>Page <span className="font-semibold text-navy-700">{pagination.page}</span> of {pagination.totalPages} <span className="text-xs text-gray-400">({pagination.total} items)</span></span>
                <div className="flex gap-2">
                  <button className="btn-secondary py-1 px-3 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <button className="btn-secondary py-1 px-3 text-xs" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CSVImportModal open={showImport} onClose={() => setShowImport(false)} />

      {/* Pawn Item Drawer */}
      <Drawer open={showDrawer} onClose={closeDrawer}
        title={createdItem ? 'Item Pawned!' : 'Pawn New Item'}
        subtitle={createdItem ? 'Barcode generated successfully' : 'Fill in the details to register a new item'}>
        {createdItem ? (
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
            <div className="bg-gradient-to-br from-navy-50 to-blue-50 rounded-2xl border border-navy-100 p-4 flex flex-col items-center gap-3">
              <BarcodeDisplay value={createdItem.barcode} showPrint
                label={selectedCustomer ? `${selectedCustomer.name} · ${createdItem.itemType}` : createdItem.itemType}
                ticketNo={createdItem.ticketNo ?? undefined} />
            </div>
            <div className="space-y-2 pt-1">
              <button className="btn-primary w-full justify-center py-3" onClick={resetForm}><Plus size={15} /> Pawn Another Item</button>
              <button className="btn-secondary w-full justify-center py-2.5" onClick={() => { closeDrawer(); navigate(`/items/${createdItem.id}`) }}>View Item Detail</button>
            </div>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); setFormError(''); createMutation.mutate() }} className="space-y-6">
            {formError && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{formError}</div>}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Customer</p>
              {selectedCustomer && (
                <div className="flex items-center gap-3 p-3 mb-3 bg-gradient-to-br from-navy-50 to-blue-50 rounded-xl border border-navy-100">
                  <CustomerAvatar name={selectedCustomer.name} size="md" />
                  <div><p className="font-semibold text-navy-700 text-sm">{selectedCustomer.name}</p><p className="font-mono text-xs text-gray-400">{selectedCustomer.nic}</p></div>
                </div>
              )}
              <label className="label">Select Customer <span className="text-red-400">*</span></label>
              <select className="input" required value={form.customerId} onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}>
                <option value="">— Choose a customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.nic}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Item Details</p>
              <label className="label">Item Type <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {ITEM_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => setForm(p => ({ ...p, itemType: t }))}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all capitalize ${form.itemType === t ? 'bg-navy-600 text-white border-navy-600 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-navy-300 hover:text-navy-600'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Net Weight (g) <span className="text-red-400">*</span></label>
              <div className="relative">
                <Scale size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9 pr-8" type="number" step="0.001" min="0.001" required placeholder="0.000"
                  value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">g</span>
              </div>
              {form.weight && !isNaN(parseFloat(form.weight)) && <div className="mt-2"><WeightBadge weight={form.weight} size="sm" /></div>}
            </div>
            <div>
              <label className="label">Pawn Date <span className="text-red-400">*</span></label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" type="date" required value={form.pawnDate} onChange={e => setForm(p => ({ ...p, pawnDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Description <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
              <textarea className="input resize-none" rows={2} placeholder="Any notes…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-2 pt-1">
              <button type="submit" className="btn-primary w-full justify-center py-3 text-base" disabled={createMutation.isPending || !form.customerId || !form.itemType}>
                {createMutation.isPending ? 'Generating barcode…' : 'Pawn Item & Generate Barcode'}
              </button>
              <button type="button" className="btn-secondary w-full justify-center py-2.5" onClick={closeDrawer}>Cancel</button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  )
}
