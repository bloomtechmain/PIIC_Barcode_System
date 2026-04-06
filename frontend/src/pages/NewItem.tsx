import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Plus } from 'lucide-react'
import { getCustomers } from '../api/customer.api'
import { createItem } from '../api/item.api'
import { Item } from '../types'
import BarcodeDisplay from '../components/ui/BarcodeDisplay'
import CustomerAvatar from '../components/ui/CustomerAvatar'
import WeightBadge from '../components/ui/WeightBadge'

const ITEM_TYPES = ['ring', 'chain', 'bracelet', 'earrings', 'necklace', 'bangle', 'pendant', 'other']

export default function NewItem() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    customerId: '',
    itemType: '',
    weight: '',
    description: '',
    pawnDate: new Date().toISOString().split('T')[0]
  })
  const [error, setError]             = useState('')
  const [createdItem, setCreatedItem] = useState<Item | null>(null)

  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: getCustomers })
  const selectedCustomer = customers.find(c => c.id === form.customerId)

  const mutation = useMutation({
    mutationFn: () => createItem({
      customerId:  form.customerId,
      itemType:    form.itemType,
      weight:      parseFloat(form.weight),
      description: form.description || undefined,
      pawnDate:    new Date(form.pawnDate).toISOString()
    }),
    onSuccess: item => setCreatedItem(item),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to pawn item'
      setError(msg)
    }
  })

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }))

  // ── Success screen ────────────────────────────────────────────────────────
  if (createdItem) {
    const customer = customers.find(c => c.id === createdItem.customerId)
    const label = customer ? `${customer.name} · ${createdItem.itemType}` : createdItem.itemType

    return (
      <div className="space-y-5 max-w-xl">
        <button onClick={() => navigate('/items')} className="btn-ghost text-gray-500 -ml-2">
          <ArrowLeft size={16} /> Items
        </button>

        <div className="card p-8 flex flex-col items-center text-center gap-5">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={28} className="text-green-600" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-navy-700">Item Pawned Successfully</h2>
            <p className="text-gray-500 text-sm mt-1">Barcode has been generated and assigned</p>
          </div>

          <BarcodeDisplay value={createdItem.barcode} showPrint label={label} />

          <div className="w-full bg-navy-50 rounded-xl p-4 text-left space-y-3">
            {customer && (
              <div className="flex items-center gap-3">
                <CustomerAvatar name={customer.name} size="md" />
                <div>
                  <p className="text-xs text-gray-400">Customer</p>
                  <p className="font-semibold text-navy-800">{customer.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{customer.nic}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-navy-100 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Type</p>
                <p className="font-medium capitalize">{createdItem.itemType}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Weight</p>
                <WeightBadge weight={createdItem.weight} size="sm" className="mt-0.5" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Pawn Date</p>
                <p className="font-medium">{new Date(createdItem.pawnDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Status</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-0.5">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button className="btn-primary flex-1 justify-center"
              onClick={() => {
                setCreatedItem(null)
                setForm({ customerId: '', itemType: '', weight: '', description: '', pawnDate: new Date().toISOString().split('T')[0] })
              }}>
              <Plus size={16} /> Pawn Another
            </button>
            <button className="btn-secondary flex-1 justify-center"
              onClick={() => navigate(`/items/${createdItem.id}`)}>
              View Item
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-xl">
      <button onClick={() => navigate('/items')} className="btn-ghost text-gray-500 -ml-2">
        <ArrowLeft size={16} /> Items
      </button>

      <div>
        <h1 className="text-2xl font-bold text-navy-700">Pawn New Item</h1>
        <p className="text-gray-500 text-sm mt-1">A unique barcode will be generated automatically</p>
      </div>

      <div className="card p-6">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate() }} className="space-y-4">
          <div>
            <label className="label">Customer *</label>
            <div className="flex items-center gap-3">
              {selectedCustomer && <CustomerAvatar name={selectedCustomer.name} size="sm" className="flex-shrink-0" />}
              <select className="input" required value={form.customerId} onChange={set('customerId')}>
                <option value="">— Select customer —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.nic})</option>
                ))}
              </select>
            </div>
            {selectedCustomer && (
              <p className="text-xs text-gray-400 mt-1 ml-1">
                NIC: {selectedCustomer.nic}{selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ''}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Item Type *</label>
              <select className="input" required value={form.itemType} onChange={set('itemType')}>
                <option value="">— Select type —</option>
                {ITEM_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Weight (g) *</label>
              <div className="relative">
                <input className="input pr-6" type="number" step="0.001" min="0.001"
                  required placeholder="0.000" value={form.weight} onChange={set('weight')} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">g</span>
              </div>
              {form.weight && !isNaN(parseFloat(form.weight)) && (
                <div className="mt-1.5">
                  <WeightBadge weight={form.weight} size="sm" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Pawn Date *</label>
            <input className="input" type="date" required value={form.pawnDate} onChange={set('pawnDate')} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2}
              placeholder="Optional notes about the item…"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center py-2.5" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Pawn Item & Generate Barcode'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/items')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
