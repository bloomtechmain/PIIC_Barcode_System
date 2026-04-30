import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, ClipboardList, Calendar, GitBranch,
  CheckCircle, Package, ChevronRight, Pencil, Save, X, ExternalLink,
  Hash, FileDown, FileText, Plus, Sparkles
} from 'lucide-react'
import { getAudit, getInitialAuditItems, finalizeAudit, addAuditItem } from '../api/audit.api'
import { updateItem } from '../api/item.api'
import { Item } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import CustomerAvatar from '../components/ui/CustomerAvatar'
import WeightBadge from '../components/ui/WeightBadge'
import { useAuth } from '../context/AuthContext'
import { downloadAuditExcel, downloadAuditPDF } from '../utils/auditReport'

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

// Simple easy words for confirmation
const CONFIRM_WORDS = [
  'APPLE', 'BRAVE', 'CLOUD', 'DELTA', 'EAGLE',
  'FLAME', 'GRACE', 'HONEY', 'IVORY', 'JEWEL',
  'LEMON', 'MAPLE', 'NOBLE', 'OLIVE', 'PEARL',
  'QUILL', 'RIVER', 'SOLAR', 'TIGER', 'ULTRA',
]

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

export default function InitialAuditDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAdmin, isSuperAdmin } = useAuth()
  const canEdit = isAdmin || isSuperAdmin

  // ── Expand / edit state ──────────────────────────────────────────────────
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())
  const [expandedItems, setExpandedItems]     = useState<Set<string>>(new Set())
  const [editingItemId, setEditingItemId]     = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditState>({ itemType: '', weight: '', grossWeight: '', karatage: '', remarks: '' })
  const [editError, setEditError] = useState('')

  // ── Ticket completion tracking ───────────────────────────────────────────
  const [completedTickets, setCompletedTickets] = useState<Set<string>>(new Set())

  // ── Add-item form ────────────────────────────────────────────────────────
  const [addingToTicket, setAddingToTicket] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<EditState>({ itemType: '', weight: '', grossWeight: '', karatage: '', remarks: '' })
  const [addError, setAddError]             = useState('')

  // ── Finalize modal state ─────────────────────────────────────────────────
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [confirmWord, setConfirmWord]             = useState('')
  const [confirmInput, setConfirmInput]           = useState('')

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: audit, isLoading: auditLoading } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => getAudit(id!)
  })

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['audit-items', id],
    queryFn: () => getInitialAuditItems(id!)
  })

  const editMutation = useMutation({
    mutationFn: (itemId: string) => updateItem(itemId, {
      itemType:    editForm.itemType    || undefined,
      weight:      editForm.weight      ? parseFloat(editForm.weight)      : undefined,
      grossWeight: editForm.grossWeight ? parseFloat(editForm.grossWeight) : null,
      karatage:    editForm.karatage    ? parseInt(editForm.karatage, 10)  : null,
      remarks:     editForm.remarks     || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-items', id] })
      setEditingItemId(null)
      setEditError('')
    },
    onError: (err: unknown) => {
      setEditError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save')
    }
  })

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeAudit(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit', id] })
      qc.invalidateQueries({ queryKey: ['audits'] })
      setShowFinalizeModal(false)
    },
    onError: (err: unknown) => {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to finalize')
    }
  })

  const addMutation = useMutation({
    mutationFn: (group: TicketGroup) => addAuditItem(id!, {
      customerId:  group.customer!.id,
      ticketNo:    group.ticketNo,
      pawnDate:    group.pawnDate,
      itemType:    addForm.itemType,
      weight:      parseFloat(addForm.weight),
      grossWeight: addForm.grossWeight ? parseFloat(addForm.grossWeight) : null,
      karatage:    addForm.karatage    ? parseInt(addForm.karatage, 10)  : null,
      remarks:     addForm.remarks     || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-items', id] })
      setAddingToTicket(null)
      setAddForm({ itemType: '', weight: '', grossWeight: '', karatage: '', remarks: '' })
      setAddError('')
    },
    onError: (err: unknown) => {
      setAddError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add item')
    }
  })

  const openAddForm = (key: string) => {
    setAddingToTicket(key)
    setAddForm({ itemType: '', weight: '', grossWeight: '', karatage: '', remarks: '' })
    setAddError('')
    // Ensure ticket is expanded
    setExpandedTickets(prev => { const n = new Set(prev); n.add(key); return n })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleTicket = (key: string) =>
    setExpandedTickets(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  const toggleItem = (itemId: string) =>
    setExpandedItems(prev => { const n = new Set(prev); n.has(itemId) ? n.delete(itemId) : n.add(itemId); return n })

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
    setExpandedItems(prev => { const n = new Set(prev); n.add(item.id); return n })
  }

  const markTicketDone = (key: string) => {
    setCompletedTickets(prev => new Set([...prev, key]))
    // Collapse the ticket
    setExpandedTickets(prev => { const n = new Set(prev); n.delete(key); return n })
    // Clear any active edit within this ticket's items
    setEditingItemId(null)
  }

  const openFinalizeModal = () => {
    const word = CONFIRM_WORDS[Math.floor(Math.random() * CONFIRM_WORDS.length)]
    setConfirmWord(word)
    setConfirmInput('')
    setShowFinalizeModal(true)
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  if (auditLoading || itemsLoading) return <LoadingSpinner />
  if (!audit) return <div className="text-center py-20 text-gray-400">Audit not found</div>

  const items        = itemsData?.items ?? []
  const filterBranch = itemsData?.filterBranch ?? null
  const allGroups    = groupByTicket(items)
  const pendingGroups   = allGroups.filter(g => !completedTickets.has(g.key))
  const completedGroups = allGroups.filter(g =>  completedTickets.has(g.key))
  const total      = allGroups.length
  const done       = completedGroups.length
  const progress   = total > 0 ? Math.round((done / total) * 100) : 0
  const canFinalize = canEdit && !audit.finalizedAt && total > 0 && done === total

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/audits')}
            className="mt-0.5 p-2 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-navy-600 hover:border-navy-200 transition-all">
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-navy-700">Initial Audit</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-violet-400 text-white shadow-sm">
                <ClipboardList size={10} /> Initial
              </span>
              {audit.finalizedAt ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-sm">
                  <CheckCircle size={10} /> Finalized
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-magenta-500 to-pink-400 text-white shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" /> In Progress
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-0.5">
              {new Date(audit.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              {audit.createdBy && ` · Created by ${audit.createdBy.name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Download buttons — available whenever items are loaded */}
          {allGroups.length > 0 && (
            <>
              <button
                onClick={() => downloadAuditExcel(audit, allGroups, filterBranch)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-all"
                title="Download Excel report"
              >
                <FileDown size={13} /> Excel
              </button>
              <button
                onClick={() => downloadAuditPDF(audit, allGroups, filterBranch)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-xl transition-all"
                title="Download PDF report"
              >
                <FileText size={13} /> PDF
              </button>
            </>
          )}

          {canEdit && !audit.finalizedAt && (
            <button
              className={`gap-2 ${canFinalize ? 'btn-primary' : 'btn-secondary opacity-60 cursor-not-allowed'}`}
              onClick={canFinalize ? openFinalizeModal : undefined}
              title={canFinalize ? undefined : `Mark all ${total} tickets as done first`}
            >
              <CheckCircle size={15} />
              {canFinalize ? 'Finalize Audit' : `${done}/${total} Tickets Done`}
            </button>
          )}
        </div>
      </div>

      {/* ── Info cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Items Covered</p>
          <p className="text-lg font-bold text-navy-700 mt-0.5">{audit.totalItemsAtTime}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Ticket Groups</p>
          <p className="text-lg font-bold text-navy-700 mt-0.5">{total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><Calendar size={9} />Date Range</p>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">
            {audit.filterDateFrom
              ? `${new Date(audit.filterDateFrom).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${audit.filterDateTo ? new Date(audit.filterDateTo).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'present'}`
              : <span className="text-gray-300 text-xs font-normal">All dates</span>}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><GitBranch size={9} />Branch</p>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">
            {filterBranch ? filterBranch.name : <span className="text-gray-300 text-xs font-normal">All branches</span>}
          </p>
        </div>
      </div>

      {/* ── Notes ────────────────────────────────────────────────────── */}
      {audit.notes && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          {audit.notes}
        </div>
      )}

      {/* ── Progress bar ─────────────────────────────────────────────── */}
      {!audit.finalizedAt && total > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Hash size={13} className="text-purple-500" />
              Inspection Progress
            </p>
            <span className="text-sm font-bold text-navy-700">{done} <span className="text-gray-400 font-normal">of</span> {total} <span className="text-gray-400 font-normal text-xs">tickets</span></span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-purple-500 to-violet-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 ? (
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <CheckCircle size={12} /> All tickets reviewed — click Finalize Audit to complete
            </p>
          ) : (
            <p className="text-xs text-gray-400">{total - done} ticket{total - done !== 1 ? 's' : ''} remaining</p>
          )}
        </div>
      )}

      {/* ── Pending tickets table ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {pendingGroups.length === 0 && done === 0 ? (
          <EmptyState icon={Package} title="No items match the filters"
            description="Try adjusting the date range or branch filter." />
        ) : pendingGroups.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <p className="font-bold text-emerald-700">All {total} tickets reviewed!</p>
            <p className="text-gray-400 text-sm">Click <strong>Finalize Audit</strong> in the header to complete.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">

              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-violet-500">
                  <th className="w-10" />
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-purple-100 uppercase tracking-wider">Ticket No</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-purple-100 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-purple-100 uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-purple-100 uppercase tracking-wider">Pawn Date</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-purple-100 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-purple-100 uppercase tracking-wider">Action</th>
                </tr>
              </thead>

              <tbody>
                {pendingGroups.map(group => {
                  const ticketOpen  = expandedTickets.has(group.key)
                  const activeCount = group.items.filter(i => i.status === 'ACTIVE').length
                  const relCount    = group.items.length - activeCount

                  return (
                    <>
                      {/* ── Ticket group row ── */}
                      <tr key={group.key}
                        onClick={() => toggleTicket(group.key)}
                        className={`cursor-pointer border-b border-gray-100 transition-colors select-none ${ticketOpen ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                        <td className="pl-4 py-3.5">
                          <ChevronRight size={15} className={`text-gray-400 transition-transform duration-200 ${ticketOpen ? 'rotate-90 text-purple-500' : ''}`} />
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
                        {/* Mark Done */}
                        <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          {canEdit && !audit.finalizedAt && (
                            <button
                              onClick={() => markTicketDone(group.key)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-500 border border-emerald-200 hover:border-emerald-500 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                            >
                              <CheckCircle size={11} /> Mark Done
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* ── Item sub-rows ── */}
                      {ticketOpen && group.items.map((item, idx) => {
                        const itemOpen  = expandedItems.has(item.id)
                        const isEditing = editingItemId === item.id
                        const isLast    = idx === group.items.length - 1

                        return (
                          <>
                            <tr key={item.id}
                              onClick={() => { if (!isEditing) toggleItem(item.id) }}
                              className={`border-b ${isLast && !itemOpen ? 'border-b-2 border-b-gray-200' : 'border-purple-50'} cursor-pointer transition-colors ${itemOpen ? 'bg-blue-50/60' : 'bg-purple-50/30 hover:bg-blue-50/40'}`}>
                              <td className="pl-6 py-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-px h-4 bg-purple-200" />
                                  <ChevronRight size={13} className={`text-purple-300 transition-transform duration-200 ${itemOpen ? 'rotate-90 text-purple-500' : ''}`} />
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
                              <td />
                            </tr>

                            {/* ── Expanded item detail + edit ── */}
                            {itemOpen && (
                              <tr key={`${item.id}-detail`} className={`${isLast ? 'border-b-2 border-b-gray-200' : 'border-b border-purple-50'} bg-white`}>
                                <td colSpan={7} className="px-6 py-4 pl-12">
                                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">

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
                                        {canEdit && !audit.finalizedAt && !isEditing && (
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

                      {/* ── Footer: actions row ── */}
                      {ticketOpen && (
                        <tr key={`${group.key}-footer`} className="bg-purple-50/20">
                          <td colSpan={7} className="px-6 py-2.5 pl-12">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                {group.customer && (
                                  <button onClick={e => { e.stopPropagation(); navigate(`/customers/${group.customer!.id}`) }}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-800 bg-white border border-navy-200 px-3 py-1.5 rounded-lg transition-all">
                                    <ExternalLink size={11} /> View {group.customer.name}'s Profile
                                  </button>
                                )}
                                {canEdit && !audit.finalizedAt && group.customer && (
                                  <button
                                    onClick={e => { e.stopPropagation(); addingToTicket === group.key ? setAddingToTicket(null) : openAddForm(group.key) }}
                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${addingToTicket === group.key ? 'bg-blue-600 text-white border-blue-600' : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'}`}
                                  >
                                    <Plus size={11} /> Add Item to Ticket
                                  </button>
                                )}
                              </div>
                              {canEdit && !audit.finalizedAt && (
                                <button
                                  onClick={e => { e.stopPropagation(); markTicketDone(group.key) }}
                                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 px-4 py-2 rounded-xl shadow-sm transition-all"
                                >
                                  <CheckCircle size={14} /> Done — Mark Ticket Complete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* ── Add item inline form ── */}
                      {ticketOpen && addingToTicket === group.key && (
                        <tr key={`${group.key}-add`} className="border-b-2 border-blue-200 bg-blue-50/40">
                          <td colSpan={7} className="px-6 py-5 pl-12">
                            <div className="bg-white border border-blue-200 rounded-2xl p-5 space-y-4">
                              {/* Header */}
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Sparkles size={13} className="text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-navy-700 text-sm">Add New Item to Ticket <span className="font-mono text-blue-700">{group.ticketNo}</span></p>
                                  <p className="text-[11px] text-gray-400">This item will be marked as <strong>Added in Audit</strong> in the report.</p>
                                </div>
                              </div>

                              {addError && <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{addError}</div>}

                              {/* Item type */}
                              <div>
                                <p className="label mb-2">Item Type <span className="text-red-400">*</span></p>
                                <div className="flex flex-wrap gap-1.5">
                                  {ITEM_TYPES.map(t => (
                                    <button key={t} type="button"
                                      onClick={() => setAddForm(p => ({ ...p, itemType: t }))}
                                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all capitalize ${addForm.itemType === t ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-500 border-gray-200 hover:border-navy-300'}`}>
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Weights / karatage / remarks */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <label className="label">Net Weight (g) <span className="text-red-400">*</span></label>
                                  <input className="input text-sm" type="number" step="0.001" min="0.001" placeholder="0.000"
                                    value={addForm.weight} onChange={e => setAddForm(p => ({ ...p, weight: e.target.value }))} />
                                </div>
                                <div>
                                  <label className="label">Gross Weight (g)</label>
                                  <input className="input text-sm" type="number" step="0.001" min="0.001" placeholder="0.000"
                                    value={addForm.grossWeight} onChange={e => setAddForm(p => ({ ...p, grossWeight: e.target.value }))} />
                                </div>
                                <div>
                                  <label className="label">Karatage (K)</label>
                                  <input className="input text-sm" type="number" min="1" max="24" placeholder="e.g. 22"
                                    value={addForm.karatage} onChange={e => setAddForm(p => ({ ...p, karatage: e.target.value }))} />
                                </div>
                                <div>
                                  <label className="label">Remarks</label>
                                  <input className="input text-sm" placeholder="Any remarks…"
                                    value={addForm.remarks} onChange={e => setAddForm(p => ({ ...p, remarks: e.target.value }))} />
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => addMutation.mutate(group)}
                                  disabled={addMutation.isPending || !addForm.itemType || !addForm.weight}
                                  className="btn-primary gap-1.5 text-sm py-2">
                                  <Save size={13} />{addMutation.isPending ? 'Adding…' : 'Add Item to Ticket'}
                                </button>
                                <button onClick={() => { setAddingToTicket(null); setAddError('') }}
                                  className="btn-secondary gap-1.5 text-sm py-2">
                                  <X size={13} /> Cancel
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
        )}
      </div>

      {/* ── Finalize confirmation modal ──────────────────────────────── */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* Modal header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Finalize Initial Audit</p>
                  <p className="text-emerald-100 text-sm">{done} ticket group{done !== 1 ? 's' : ''} reviewed · {items.length} items</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">

              {/* Completed tickets list */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CheckCircle size={11} className="text-emerald-500" /> Reviewed Tickets ({done})
                </p>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 max-h-52 overflow-y-auto space-y-1.5">
                  {completedGroups.map(g => (
                    <div key={g.key} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle size={10} className="text-emerald-600" />
                        </span>
                        <span className="font-mono text-xs font-semibold text-navy-700 bg-white border border-navy-100 px-2 py-0.5 rounded">
                          {g.ticketNo}
                        </span>
                        {g.customer && <span className="text-xs text-gray-500">{g.customer.name}</span>}
                      </div>
                      <span className="text-xs text-gray-400">{g.items.length} item{g.items.length !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Type-to-confirm */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  ⚠ This action cannot be undone
                </p>
                <p className="text-sm text-amber-700">
                  To confirm, type <span className="font-mono font-bold text-navy-700 bg-white border border-navy-200 px-2 py-0.5 rounded tracking-widest">{confirmWord}</span> in the box below:
                </p>
                <input
                  autoFocus
                  className="input font-mono uppercase tracking-widest text-center text-base font-bold"
                  placeholder={`Type ${confirmWord} here`}
                  value={confirmInput}
                  onChange={e => setConfirmInput(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter' && confirmInput === confirmWord) finalizeMutation.mutate() }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  className="btn-primary flex-1 justify-center py-3 text-base"
                  onClick={() => finalizeMutation.mutate()}
                  disabled={confirmInput !== confirmWord || finalizeMutation.isPending}
                >
                  {finalizeMutation.isPending ? 'Finalizing…' : 'Confirm & Finalize Audit'}
                </button>
                <button
                  className="btn-secondary px-5 py-3"
                  onClick={() => setShowFinalizeModal(false)}
                  disabled={finalizeMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
