import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IndianRupee, Plus, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { api, fetcher } from '../lib/api'
import type { Bill } from '../lib/types'

type BillItem = { label: string; amount: number }
type CreateValues = {
  patient: string
  appointment?: string
  discount: number
  tax: number
  items: BillItem[]
}

const STATUS_COLORS: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  refunded: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

export function BillingPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['billing', statusFilter],
    queryFn: () => fetcher<{ bills: Bill[] }>('/billing')
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => fetcher<{ patients: any[] }>('/patients')
  })

  const { register, handleSubmit, control, watch, reset } = useForm<CreateValues>({
    defaultValues: { items: [{ label: 'Consultation', amount: 500 }], discount: 0, tax: 0 }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const watchedDiscount = watch('discount') ?? 0
  const watchedTax = watch('tax') ?? 0
  const subtotal = (watchedItems ?? []).reduce((s, it) => s + Number(it.amount || 0), 0)
  const total = subtotal - Number(watchedDiscount) + Number(watchedTax)

  const createMutation = useMutation({
    mutationFn: (values: CreateValues) => api.post('/billing', values),
    onSuccess: () => {
      toast.success('Bill created')
      reset({ items: [{ label: 'Consultation', amount: 500 }], discount: 0, tax: 0 })
      setIsModalOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['billing'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to create bill')
  })

  const statusMutation = useMutation({
    mutationFn: ({ billId, status }: { billId: string; status: string }) =>
      api.put('/billing/status', { billId, status }),
    onSuccess: () => {
      toast.success('Bill status updated')
      void queryClient.invalidateQueries({ queryKey: ['billing'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to update bill')
  })

  const bills = (data?.bills ?? []).filter((b) => !statusFilter || b.status === statusFilter)
  const totalRevenue = (data?.bills ?? []).filter((b) => b.status === 'paid').reduce((s, b) => s + b.total, 0)
  const unpaidCount = (data?.bills ?? []).filter((b) => b.status === 'unpaid').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-slate-500">Create and manage patient bills and payment records.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> Create Bill
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-green-100 dark:bg-green-950/30 grid place-items-center">
            <IndianRupee className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Revenue</p>
            <p className="text-xl font-bold">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="panel p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-red-100 dark:bg-red-950/30 grid place-items-center">
            <IndianRupee className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Unpaid Bills</p>
            <p className="text-xl font-bold">{unpaidCount}</p>
          </div>
        </div>
        <div className="panel p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-800 grid place-items-center">
            <IndianRupee className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Bills</p>
            <p className="text-xl font-bold">{data?.bills?.length ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 panel p-3">
        <select className="field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3">Patient</th>
                <th className="p-3">Items</th>
                <th className="p-3">Subtotal</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading bills…</td></tr>
              )}
              {!isLoading && bills.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No bills found.</td></tr>
              )}
              {bills.map((bill) => {
                const patient = typeof bill.patient === 'object' ? bill.patient : null
                return (
                  <tr key={bill._id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">
                      <p className="font-medium">{patient?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{patient?.patientId}</p>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">
                      {bill.items.slice(0, 2).map((it, i) => (
                        <span key={i} className="block">{it.label}</span>
                      ))}
                      {bill.items.length > 2 && <span className="text-slate-400">+{bill.items.length - 2} more</span>}
                    </td>
                    <td className="p-3">₹{bill.subtotal}</td>
                    <td className="p-3 text-green-600">-₹{bill.discount}</td>
                    <td className="p-3 font-bold">₹{bill.total}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[bill.status] ?? ''}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">{new Date(bill.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {bill.status === 'unpaid' && (
                          <button
                            title="Mark Paid"
                            className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600"
                            onClick={() => statusMutation.mutate({ billId: bill._id, status: 'paid' })}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {bill.status === 'paid' && (
                          <button
                            title="Refund"
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                            onClick={() => statusMutation.mutate({ billId: bill._id, status: 'refunded' })}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel w-full max-w-lg p-6 bg-white dark:bg-slate-900 shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-teal" /> Create Bill
            </h3>
            <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Patient</label>
                <select className="field" {...register('patient', { required: true })}>
                  <option value="">Select patient</option>
                  {(patientsData?.patients ?? []).map((p) => (
                    <option key={p._id} value={p._id}>{p.name} — {p.patientId}</option>
                  ))}
                </select>
              </div>

              {/* Bill Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bill Items</label>
                  <button type="button" className="text-xs text-teal hover:underline" onClick={() => append({ label: '', amount: 0 })}>
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <input className="field flex-1" placeholder="Description" {...register(`items.${index}.label`, { required: true })} />
                      <input type="number" className="field w-28" placeholder="₹ Amount" {...register(`items.${index}.amount`, { valueAsNumber: true, required: true })} />
                      {fields.length > 1 && (
                        <button type="button" className="text-red-400 hover:text-red-600 p-1" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Discount (₹)</label>
                  <input type="number" className="field" defaultValue={0} {...register('discount', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Tax (₹)</label>
                  <input type="number" className="field" defaultValue={0} {...register('tax', { valueAsNumber: true })} />
                </div>
              </div>

              {/* Total preview */}
              <div className="rounded-md bg-slate-50 dark:bg-slate-800 p-3 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{watchedDiscount}</span></div>
                <div className="flex justify-between text-slate-500"><span>Tax</span><span>+₹{watchedTax}</span></div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
                  <span>Total</span><span>₹{total}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating…' : 'Create Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
