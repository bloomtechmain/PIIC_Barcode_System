import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Package, Phone, Mail, MapPin, CreditCard, Calendar, Scale, ChevronRight, Users } from 'lucide-react'
import { getCustomer } from '../api/customer.api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Badge from '../components/ui/Badge'
import WeightBadge from '../components/ui/WeightBadge'

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

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id!),
    enabled: !!id
  })

  if (isLoading) return <LoadingSpinner />
  if (!customer) return null

  const active      = customer.items?.filter(i => i.status === 'ACTIVE')   ?? []
  const released    = customer.items?.filter(i => i.status === 'RELEASED') ?? []
  const totalWeight = active.reduce((sum, i) => sum + Number(i.weight), 0)

  const contactFields = [
    { icon: CreditCard, label: 'NIC / ID',      value: customer.nic,     mono: true  },
    { icon: Phone,      label: 'Phone',          value: customer.phone,   mono: false },
    { icon: Mail,       label: 'Email',          value: customer.email,   mono: false },
    { icon: MapPin,     label: 'Address',        value: customer.address, mono: false },
    { icon: Calendar,   label: 'Member Since',
      value: new Date(customer.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      mono: false },
  ].filter(f => f.value)

  return (
    <div className="space-y-4">

      {/* Back */}
      <button onClick={() => navigate('/customers')} className="btn-ghost text-gray-500 -ml-2">
        <ArrowLeft size={16} /> Customers
      </button>

      {/* ── Header banner ─────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-7 md:px-8"
        style={{ background: 'linear-gradient(135deg, #1b1464 0%, #2a2480 60%, #a51655 100%)' }}>

        {/* Background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full border border-white/10" />
          <div className="absolute -top-3 -right-3 w-32 h-32 rounded-full border border-white/10" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rotate-45 border border-white/10" />
          <div className="absolute top-0 right-0 w-2/3 h-full opacity-[0.03]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 18px)' }} />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full border border-white/8" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center shadow-xl">
              <span className="text-3xl font-bold text-white select-none">
                {customer.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
          </div>

          {/* Name + contact pills */}
          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">Customer Profile</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{customer.name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-white/90 bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg">
                <CreditCard size={11} /> {customer.nic}
              </span>
              {customer.phone && (
                <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/10 border border-white/15 px-2.5 py-1 rounded-lg">
                  <Phone size={11} /> {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/10 border border-white/15 px-2.5 py-1 rounded-lg">
                  <Mail size={11} /> {customer.email}
                </span>
              )}
            </div>
          </div>

          {/* Joined date */}
          <div className="hidden sm:block text-right flex-shrink-0">
            <p className="text-white/40 text-[10px] uppercase tracking-widest">Member since</p>
            <p className="text-white/80 text-sm font-semibold mt-0.5">
              {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        <div className="card px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-navy-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy-700 leading-none">{customer.items?.length ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Total Items</p>
          </div>
        </div>

        <div className="card px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600 leading-none">{active.length}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Active</p>
          </div>
        </div>

        <div className="card px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-500 leading-none">{released.length}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Released</p>
          </div>
        </div>

        <div className="card px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-magenta-50 flex items-center justify-center flex-shrink-0">
            <Scale size={18} className="text-magenta-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-magenta-600 leading-none">{totalWeight.toFixed(2)}<span className="text-sm font-medium ml-0.5">g</span></p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Active Weight</p>
          </div>
        </div>
      </div>

      {/* ── Contact info + Items table ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Contact info */}
        <div className="card p-6 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contact Info</p>
          <div className="space-y-2">
            {contactFields.map(({ icon: Icon, label, value, mono }) => (
              <div key={label} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Icon size={13} className="text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                  <p className={`text-sm font-semibold text-gray-800 mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pawned items */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="bg-gradient-to-r from-navy-600 to-navy-500 px-5 py-4 flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <Package size={14} className="text-white" />
            </div>
            <h2 className="font-semibold text-white text-sm">Pawned Items</h2>
            <span className="ml-auto text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
              {customer.items?.length ?? 0}
            </span>
          </div>

          {!customer.items?.length ? (
            <div className="px-6 py-12 text-center">
              <Package size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No items pawned yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Weight</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Pawn Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customer.items.map(item => (
                    <tr key={item.id}
                      onClick={() => navigate(`/items/${item.id}`)}
                      className="group cursor-pointer hover:bg-gradient-to-r hover:from-navy-50 hover:to-blue-50 transition-colors">

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${typeColor[item.itemType] ?? typeColor.other}`}>
                          {item.itemType}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <WeightBadge weight={item.weight} size="sm" />
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Calendar size={11} className="text-gray-400 flex-shrink-0" />
                          {new Date(item.pawnDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge value={item.status} />
                      </td>

                      <td className="px-5 py-3.5">
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-navy-400 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
