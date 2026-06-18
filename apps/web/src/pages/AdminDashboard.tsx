import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, Boxes, ClipboardList, IndianRupee, Plus, ShieldAlert, Stethoscope, Users, Building2, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api, fetcher } from '../lib/api'
import { AddInventoryModal } from '../components/AddInventoryModal'
import { ChartPanel } from '../components/ChartPanel'
import { Metric } from '../components/Metric'

type Analytics = { patients: number; doctors: number; waiting: number; prescriptions: number; revenue: number; lowStock: number }

type UserValues = {
  name: string
  email: string
  phone?: string
  role: 'admin' | 'receptionist' | 'doctor' | 'chemist' | 'patient'
  password?: string
  status?: 'active' | 'inactive'
  specialization?: string
  department?: string
  room?: string
  consultationFee?: number
}

type DepartmentValues = {
  name: string
  code: string
  floor?: string
  description?: string
  active?: boolean
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  doctor: 'bg-teal/10 text-teal',
  chemist: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  receptionist: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  patient: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

export function AdminDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'departments' | 'inventory' | 'audit'>('overview')

  // User modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  // Department modal state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<any | null>(null)
  const [deleteDeptId, setDeleteDeptId] = useState<string | null>(null)
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false)

  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: () => fetcher<Analytics>('/admin/analytics') })
  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: () => fetcher<{ users: any[] }>('/admin/users') })
  const { data: inventoryData } = useQuery({ queryKey: ['inventory'], queryFn: () => fetcher<{ inventory: any[] }>('/admin/inventory') })
  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => fetcher<{ departments: any[] }>('/admin/departments') })
  const { data: auditLogsData } = useQuery({ queryKey: ['audit-logs'], queryFn: () => fetcher<{ logs: any[] }>('/admin/audit-logs'), refetchInterval: 15000 })

  const stats = analytics ?? { patients: 0, doctors: 0, waiting: 0, prescriptions: 0, revenue: 0, lowStock: 0 }

  const userForm = useForm<UserValues>({ defaultValues: { role: 'receptionist' } })
  const deptForm = useForm<DepartmentValues>()
  const selectedRole = userForm.watch('role')

  const openAddUser = () => { setEditingUser(null); userForm.reset({ role: 'receptionist' }); setIsUserModalOpen(true) }
  const openEditUser = (user: any) => {
    setEditingUser(user)
    userForm.reset({ name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, status: user.status, password: '' })
    setIsUserModalOpen(true)
  }
  const openAddDept = () => { setEditingDept(null); deptForm.reset(); setIsDeptModalOpen(true) }
  const openEditDept = (dept: any) => {
    setEditingDept(dept)
    deptForm.reset({ name: dept.name, code: dept.code, floor: dept.floor ?? '', description: dept.description ?? '', active: dept.active })
    setIsDeptModalOpen(true)
  }

  // User mutations
  const saveUserMutation = useMutation({
    mutationFn: async (values: UserValues) => {
      if (editingUser) return (await api.put(`/admin/users/${editingUser._id}`, values)).data
      return (await api.post('/admin/users', values)).data
    },
    onSuccess: () => {
      toast.success(editingUser ? 'User updated' : 'User created')
      setIsUserModalOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to save user')
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted')
      setDeleteUserId(null)
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to delete user')
  })

  // Department mutations
  const saveDeptMutation = useMutation({
    mutationFn: async (values: DepartmentValues) => {
      if (editingDept) return (await api.put(`/admin/departments/${editingDept._id}`, values)).data
      return (await api.post('/admin/departments', values)).data
    },
    onSuccess: () => {
      toast.success(editingDept ? 'Department updated' : 'Department created')
      setIsDeptModalOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to save department')
  })

  const deleteDeptMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/departments/${id}`),
    onSuccess: () => {
      toast.success('Department deleted')
      setDeleteDeptId(null)
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to delete department')
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Manage hospital configurations, users, inventory, and audit logs.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'users' && (
            <button className="btn-primary flex items-center gap-2" onClick={openAddUser}>
              <Plus className="h-4 w-4" /> Add User
            </button>
          )}
          {activeTab === 'departments' && (
            <button className="btn-primary flex items-center gap-2" onClick={openAddDept}>
              <Plus className="h-4 w-4" /> Add Department
            </button>
          )}
          {activeTab === 'inventory' && (
            <button className="btn-primary flex items-center gap-2" onClick={() => setIsInventoryModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add to Inventory
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {[
          { id: 'overview' as const, label: 'Overview', icon: Activity },
          { id: 'users' as const, label: 'User Management', icon: Users },
          { id: 'departments' as const, label: 'Departments', icon: Building2 },
          { id: 'inventory' as const, label: 'Inventory', icon: Boxes },
          { id: 'audit' as const, label: 'Audit Logs', icon: ShieldAlert }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === id ? 'border-teal text-teal' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
            }`}
          >
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Metric label="Patients" value={stats.patients} icon={Users} />
            <Metric label="Doctors" value={stats.doctors} icon={Stethoscope} tone="text-coral" />
            <Metric label="Live Queue" value={stats.waiting} icon={ClipboardList} tone="text-amber" />
            <Metric label="Pharmacy Orders" value={stats.prescriptions} icon={Boxes} tone="text-sage" />
            <Metric label="Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={IndianRupee} tone="text-blue-500" />
          </section>
          <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
            <ChartPanel labels={['Patients', 'Doctors', 'Queue', 'Orders', 'Low Stock']} values={[stats.patients, stats.doctors, stats.waiting, stats.prescriptions, stats.lowStock]} />
            <div className="panel p-4">
              <h2 className="font-semibold text-lg mb-4">Quick Links</h2>
              <div className="space-y-2">
                {([['Manage System Users', 'users', Users], ['Manage Departments', 'departments', Building2], ['Manage Inventory', 'inventory', Boxes], ['Security & Audit Trails', 'audit', ShieldAlert]] as const).map(([label, tab, Icon]) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className="w-full flex items-center justify-between p-3 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-medium transition">
                    <span>{label}</span><Icon className="h-4 w-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-semibold text-lg">System Users ({usersData?.users?.length ?? 0})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(usersData?.users ?? []).map((user) => (
                  <tr key={user._id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3 text-slate-500">{user.email}</td>
                    <td className="p-3 text-slate-500">{user.phone ?? '—'}</td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-0.5 text-xs capitalize font-medium ${ROLE_COLORS[user.role] ?? ''}`}>{user.role}</span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {user.status ?? 'active'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button title="Edit user" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-teal transition" onClick={() => openEditUser(user)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button title="Delete user" className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition" onClick={() => setDeleteUserId(user._id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(usersData?.users ?? []).length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-semibold text-lg">Hospital Departments ({deptData?.departments?.length ?? 0})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Floor</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(deptData?.departments ?? []).map((dept) => (
                  <tr key={dept._id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-teal">{dept.code}</td>
                    <td className="p-3 font-medium">{dept.name}</td>
                    <td className="p-3 text-slate-500">Floor {dept.floor ?? '—'}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{dept.description ?? '—'}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${dept.active ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'}`}>
                        {dept.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button title="Edit department" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-teal transition" onClick={() => openEditDept(dept)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button title="Delete department" className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition" onClick={() => setDeleteDeptId(dept._id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(deptData?.departments ?? []).length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">No departments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-semibold text-lg">Pharmacy Inventory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Batch No</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Reorder Threshold</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(inventoryData?.inventory ?? []).map((item) => {
                  const isLow = item.quantity <= item.reorderLevel
                  return (
                    <tr key={item._id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="p-3 font-medium">{item.medicine?.name}</td>
                      <td className="p-3 font-mono text-xs">{item.batchNo}</td>
                      <td className="p-3 font-bold">{item.quantity}</td>
                      <td className="p-3 text-slate-500">{item.reorderLevel}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isLow ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'}`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {(inventoryData?.inventory ?? []).length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">No inventory records.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-semibold text-lg">System Audit Trails</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {(auditLogsData?.logs ?? []).map((log) => (
                  <tr key={log._id} className="border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
                    <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-3"><p className="font-semibold">{log.actor?.name ?? 'System'}</p><p className="text-xs text-slate-400">{log.actor?.email}</p></td>
                    <td className="p-3 font-medium text-amber-600 dark:text-amber-400">{log.action}</td>
                    <td className="p-3 text-slate-500">{log.entity} <span className="text-slate-400 text-xs">({log.entityId ?? '—'})</span></td>
                    <td className="p-3 font-mono text-xs text-slate-500">{log.ip ?? '127.0.0.1'}</td>
                  </tr>
                ))}
                {(auditLogsData?.logs ?? []).length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">No audit logs yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── User Modal (Add / Edit) ─────────────────────────────────── */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel w-full max-w-lg p-6 bg-white dark:bg-slate-900 shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={userForm.handleSubmit((v) => saveUserMutation.mutate(v))} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Full Name</label>
                <input className="field" placeholder="John Doe" {...userForm.register('name', { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Email</label>
                  <input type="email" className="field" placeholder="user@hospital.local" disabled={!!editingUser} {...userForm.register('email', { required: !editingUser })} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Phone</label>
                  <input className="field" placeholder="9000000000" {...userForm.register('phone')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Role</label>
                  <select className="field" disabled={!!editingUser} {...userForm.register('role', { required: true })}>
                    <option value="admin">Admin</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="doctor">Doctor</option>
                    <option value="chemist">Chemist</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    {editingUser ? 'New Password (optional)' : 'Password'}
                  </label>
                  <input type="password" className="field" placeholder={editingUser ? 'Leave blank to keep' : 'Password@123'} {...userForm.register('password')} />
                </div>
              </div>
              {editingUser && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Account Status</label>
                  <select className="field" {...userForm.register('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
              {selectedRole === 'doctor' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-xs font-bold text-teal flex items-center gap-1"><Building2 className="h-3 w-3" /> Doctor Profile</p>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Specialization</label>
                    <input className="field bg-white dark:bg-slate-900" placeholder="e.g. Cardiology" {...userForm.register('specialization')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Department</label>
                      <select className="field bg-white dark:bg-slate-900" {...userForm.register('department')}>
                        <option value="">Select Department</option>
                        {(deptData?.departments ?? []).map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Consultation Fee (₹)</label>
                      <input type="number" defaultValue={500} className="field bg-white dark:bg-slate-900" {...userForm.register('consultationFee', { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Room No</label>
                    <input className="field bg-white dark:bg-slate-900" placeholder="e.g. 102" {...userForm.register('room')} />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" className="btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saveUserMutation.isPending}>
                  {saveUserMutation.isPending ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Department Modal (Add / Edit) ───────────────────────────── */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-xl rounded-lg">
            <h3 className="text-lg font-bold mb-4">{editingDept ? 'Edit Department' : 'Create Department'}</h3>
            <form onSubmit={deptForm.handleSubmit((v) => saveDeptMutation.mutate(v))} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Department Name</label>
                <input className="field" placeholder="e.g. Pediatrics" {...deptForm.register('name', { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Code</label>
                  <input className="field" placeholder="e.g. PED" {...deptForm.register('code', { required: true })} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Floor</label>
                  <input className="field" placeholder="e.g. 3" {...deptForm.register('floor')} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Description</label>
                <textarea className="textarea" placeholder="Clinical specialty and focus…" {...deptForm.register('description')} />
              </div>
              {editingDept && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Status</label>
                  <select className="field" {...deptForm.register('active', { setValueAs: (v) => v === 'true' || v === true })}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" className="btn-secondary" onClick={() => setIsDeptModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saveDeptMutation.isPending}>
                  {saveDeptMutation.isPending ? 'Saving…' : editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete User Confirm ─────────────────────────────────────── */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel w-full max-w-sm p-6 bg-white dark:bg-slate-900 shadow-xl rounded-lg text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/30 grid place-items-center mx-auto">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold">Delete User?</h3>
            <p className="text-sm text-slate-500">This will permanently remove the user and all linked staff profile data. This action cannot be undone.</p>
            <div className="flex gap-3 justify-center pt-2">
              <button className="btn-secondary" onClick={() => setDeleteUserId(null)}>Cancel</button>
              <button
                className="btn-primary bg-red-500 hover:bg-red-600 border-red-500"
                disabled={deleteUserMutation.isPending}
                onClick={() => deleteUserMutation.mutate(deleteUserId)}
              >
                {deleteUserMutation.isPending ? 'Deleting…' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Department Confirm ───────────────────────────────── */}
      {deleteDeptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel w-full max-w-sm p-6 bg-white dark:bg-slate-900 shadow-xl rounded-lg text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/30 grid place-items-center mx-auto">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold">Delete Department?</h3>
            <p className="text-sm text-slate-500">This will permanently remove the department. Patients and doctors linked to it will not be deleted but may lose their department assignment.</p>
            <div className="flex gap-3 justify-center pt-2">
              <button className="btn-secondary" onClick={() => setDeleteDeptId(null)}>Cancel</button>
              <button
                className="btn-primary bg-red-500 hover:bg-red-600 border-red-500"
                disabled={deleteDeptMutation.isPending}
                onClick={() => deleteDeptMutation.mutate(deleteDeptId)}
              >
                {deleteDeptMutation.isPending ? 'Deleting…' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isInventoryModalOpen && (
        <AddInventoryModal
          onClose={() => setIsInventoryModalOpen(false)}
          onAdded={() => {
            void queryClient.invalidateQueries({ queryKey: ['inventory'] })
            void queryClient.invalidateQueries({ queryKey: ['analytics'] })
            void queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
          }}
        />
      )}
    </div>
  )
}
