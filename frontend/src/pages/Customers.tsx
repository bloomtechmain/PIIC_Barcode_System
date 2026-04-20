import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Phone, Mail, ChevronRight, UserPlus, Upload } from 'lucide-react'
import { getCustomers, createCustomer } from '../api/customer.api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import CustomerAvatar from '../components/ui/CustomerAvatar'
import Drawer from '../components/ui/Drawer'
import CSVImportModal from '../components/ui/CSVImportModal'

export default function Customers() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch]       = useState('')
  const [showDrawer, setShowDrawer] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [form, setForm]           = useState({ name: '', nic: '', phone: '', email: '', address: '' })
  const [formError, setFormError] = useState('')

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers
  })

  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      setShowDrawer(false)
      setForm({ name: '', nic: '', phone: '', email: '', address: '' })
      setFormError('')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to create customer'
      setFormError(msg)
    }
  })

  const field = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }))

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.nic.toLowerCase().includes(search.toLowerCase())
  )

  const openDrawer = () => {
    setFormError('')
    setShowDrawer(true)
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">Customers</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {customers.length} registered customer{customers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary gap-2" onClick={() => setShowImport(true)}>
            <Upload size={15} />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button className="btn-primary gap-2" onClick={openDrawer}>
            <UserPlus size={16} />
            <span className="hidden sm:inline">New Customer</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-10 bg-white shadow-sm"
          placeholder="Search by name or NIC…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Customer grid ───────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-14 h-14 bg-gradient-to-br from-navy-50 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Users size={26} className="text-navy-500" />
          </div>
          <p className="font-semibold text-navy-700 mb-1">
            {search ? 'No customers match your search' : 'No customers yet'}
          </p>
          <p className="text-gray-400 text-sm mb-4">
            {search ? 'Try a different name or NIC number' : 'Add your first customer to get started'}
          </p>
          {!search && (
            <button className="btn-primary" onClick={openDrawer}>
              <Plus size={15} /> Add Customer
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => {
            const activeCount = c._count?.items ?? 0
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-navy-200 hover:-translate-y-0.5 transition-all duration-200 text-left overflow-hidden"
              >
                {/* Gradient top strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-navy-600 to-magenta-500" />

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <CustomerAvatar name={c.name} size="md" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-navy-700 truncate leading-tight">{c.name}</p>
                        <ChevronRight
                          size={15}
                          className="text-gray-300 group-hover:text-magenta-500 flex-shrink-0 mt-0.5 transition-colors"
                        />
                      </div>
                      <p className="font-mono text-xs text-gray-400 mt-0.5 truncate">{c.nic}</p>
                    </div>
                  </div>

                  {/* Contact row */}
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                    {c.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone size={11} /> {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 truncate">
                        <Mail size={11} /> {c.email}
                      </span>
                    )}
                    {!c.phone && !c.email && (
                      <span className="text-xs text-gray-300 italic">No contact info</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Pawned items</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      activeCount > 0
                        ? 'bg-gradient-to-r from-magenta-500 to-pink-400 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {activeCount}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── CSV Import Modal ─────────────────────────────────────────── */}
      <CSVImportModal open={showImport} onClose={() => setShowImport(false)} />

      {/* ── New Customer Drawer ──────────────────────────────────────── */}
      <Drawer
        open={showDrawer}
        onClose={() => { setShowDrawer(false); setFormError('') }}
        title="New Customer"
        subtitle="Fill in the details below to register a new customer"
      >
        <form
          onSubmit={e => { e.preventDefault(); setFormError(''); mutation.mutate(form) }}
          className="space-y-6"
        >
          {formError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {formError}
            </div>
          )}

          {/* Live avatar preview */}
          {form.name && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-navy-50 to-blue-50 rounded-xl border border-navy-100">
              <CustomerAvatar name={form.name} size="lg" />
              <div>
                <p className="font-semibold text-navy-700">{form.name}</p>
                {form.nic && <p className="font-mono text-xs text-gray-400 mt-0.5">{form.nic}</p>}
              </div>
            </div>
          )}

          {/* Personal info section */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Personal Information
            </p>
            <div className="space-y-3">
              <div>
                <label className="label">Full Name <span className="text-red-400">*</span></label>
                <input
                  className="input"
                  required
                  placeholder="e.g. Saman Kumara"
                  value={form.name}
                  onChange={field('name')}
                />
              </div>
              <div>
                <label className="label">NIC / ID Number <span className="text-red-400">*</span></label>
                <input
                  className="input font-mono tracking-wider"
                  required
                  placeholder="e.g. 199012345678"
                  value={form.nic}
                  onChange={field('nic')}
                />
              </div>
            </div>
          </div>

          {/* Contact section */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Contact Details
            </p>
            <div className="space-y-3">
              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-9"
                    type="tel"
                    placeholder="e.g. 077 123 4567"
                    value={form.phone}
                    onChange={field('phone')}
                  />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-9"
                    type="email"
                    placeholder="e.g. saman@email.com"
                    value={form.email}
                    onChange={field('email')}
                  />
                </div>
              </div>
              <div>
                <label className="label">Address</label>
                <input
                  className="input"
                  placeholder="Street, City"
                  value={form.address}
                  onChange={field('address')}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="btn-primary w-full justify-center py-3 text-base"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving…' : 'Create Customer'}
            </button>
            <button
              type="button"
              className="btn-secondary w-full justify-center py-2.5"
              onClick={() => { setShowDrawer(false); setFormError('') }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
