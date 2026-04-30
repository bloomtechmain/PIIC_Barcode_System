import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, GitBranch, Users, Trash2, UserMinus, UserPlus } from 'lucide-react'
import { getBranches, getBranch, createBranch, deleteBranch, assignCustomer, removeCustomer } from '../api/branch.api'
import { getCustomers } from '../api/customer.api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Drawer from '../components/ui/Drawer'
import { useAuth } from '../context/AuthContext'
import CustomerAvatar from '../components/ui/CustomerAvatar'

export default function Branches() {
  const qc = useQueryClient()
  const { isAdmin, isSuperAdmin } = useAuth()
  const canManage = isAdmin || isSuperAdmin

  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showManage, setShowManage] = useState(false)
  const [assignSearch, setAssignSearch] = useState('')

  const { data: branches = [], isLoading } = useQuery({ queryKey: ['branches'], queryFn: getBranches })

  const { data: selectedBranch, isLoading: loadingBranch } = useQuery({
    queryKey: ['branches', selectedId],
    queryFn: () => getBranch(selectedId!),
    enabled: !!selectedId
  })

  const { data: allCustomers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    enabled: showManage
  })

  const createMutation = useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] })
      setShowCreate(false)
      setNewName('')
      setCreateError('')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to create branch'
      setCreateError(msg)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] })
      if (selectedId) {
        setSelectedId(null)
        setShowManage(false)
      }
    }
  })

  const assignMutation = useMutation({
    mutationFn: ({ customerId }: { customerId: string }) =>
      assignCustomer(selectedId!, customerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches', selectedId] })
  })

  const removeMutation = useMutation({
    mutationFn: (customerId: string) => removeCustomer(selectedId!, customerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches', selectedId] })
  })

  const filtered = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  const assignedIds = new Set(selectedBranch?.customers?.map(cb => cb.customer.id) ?? [])
  const unassigned = allCustomers.filter(c =>
    !assignedIds.has(c.id) &&
    c.name.toLowerCase().includes(assignSearch.toLowerCase())
  )
  const assigned = selectedBranch?.customers?.filter(cb =>
    cb.customer.name.toLowerCase().includes(assignSearch.toLowerCase())
  ) ?? []

  const openManage = (id: string) => {
    setSelectedId(id)
    setAssignSearch('')
    setShowManage(true)
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">Branches</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {branches.length} branch{branches.length !== 1 ? 'es' : ''}
          </p>
        </div>
        {canManage && (
          <button className="btn-primary gap-2" onClick={() => { setCreateError(''); setShowCreate(true) }}>
            <Plus size={16} />
            <span className="hidden sm:inline">New Branch</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-10 bg-white shadow-sm"
          placeholder="Search branches…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Branch list ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-14 h-14 bg-gradient-to-br from-navy-50 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <GitBranch size={26} className="text-navy-500" />
          </div>
          <p className="font-semibold text-navy-700 mb-1">
            {search ? 'No branches match your search' : 'No branches yet'}
          </p>
          <p className="text-gray-400 text-sm mb-4">
            {search ? 'Try a different name' : 'Create your first branch to get started'}
          </p>
          {!search && canManage && (
            <button className="btn-primary" onClick={() => { setCreateError(''); setShowCreate(true) }}>
              <Plus size={15} /> Add Branch
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(b => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-navy-600 to-magenta-500" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                      <GitBranch size={18} className="text-navy-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-navy-700 leading-tight">{b.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Users size={11} />
                        {b._count?.customers ?? 0} customer{(b._count?.customers ?? 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => { if (confirm(`Delete branch "${b.name}"?`)) deleteMutation.mutate(b.id) }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      title="Delete branch"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    className="btn-secondary w-full justify-center text-xs py-2"
                    onClick={() => openManage(b.id)}
                  >
                    <Users size={13} />
                    {canManage ? 'Manage Customers' : 'View Customers'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Branch Drawer ─────────────────────────────────────── */}
      <Drawer
        open={showCreate}
        onClose={() => { setShowCreate(false); setCreateError('') }}
        title="New Branch"
        subtitle="Add a new branch location"
      >
        <form
          onSubmit={e => { e.preventDefault(); setCreateError(''); createMutation.mutate({ name: newName }) }}
          className="space-y-6"
        >
          {createError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {createError}
            </div>
          )}
          <div>
            <label className="label">Branch Name <span className="text-red-400">*</span></label>
            <input
              className="input"
              required
              placeholder="e.g. Colombo, Kandy"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="btn-primary w-full justify-center py-3 text-base"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving…' : 'Create Branch'}
            </button>
            <button
              type="button"
              className="btn-secondary w-full justify-center py-2.5"
              onClick={() => { setShowCreate(false); setCreateError('') }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Drawer>

      {/* ── Manage Customers Drawer ──────────────────────────────────── */}
      <Drawer
        open={showManage}
        onClose={() => { setShowManage(false); setSelectedId(null) }}
        title={selectedBranch?.name ?? 'Branch'}
        subtitle={canManage ? 'Assign or remove customers' : 'Customers in this branch'}
      >
        {loadingBranch ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9 text-sm"
                placeholder="Search customers…"
                value={assignSearch}
                onChange={e => setAssignSearch(e.target.value)}
              />
            </div>

            {/* Assigned customers */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Assigned ({assigned.length})
              </p>
              {assigned.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No customers assigned</p>
              ) : (
                <div className="space-y-2">
                  {assigned.map(({ customer: c }) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                      <CustomerAvatar name={c.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-700 truncate">{c.name}</p>
                        <p className="font-mono text-xs text-gray-400">{c.nic}</p>
                      </div>
                      {canManage && (
                        <button
                          onClick={() => removeMutation.mutate(c.id)}
                          disabled={removeMutation.isPending}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                          title="Remove from branch"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unassigned customers (admin only) */}
            {canManage && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Add Customer
                </p>
                {unassigned.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {assignSearch ? 'No matching unassigned customers' : 'All customers already assigned'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {unassigned.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                        <CustomerAvatar name={c.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-700 truncate">{c.name}</p>
                          <p className="font-mono text-xs text-gray-400">{c.nic}</p>
                        </div>
                        <button
                          onClick={() => assignMutation.mutate({ customerId: c.id })}
                          disabled={assignMutation.isPending}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-green-600 hover:bg-green-50 transition-colors flex-shrink-0"
                          title="Assign to branch"
                        >
                          <UserPlus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
