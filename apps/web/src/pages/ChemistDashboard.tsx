import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Boxes, Check, PackageCheck, Pill, Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api, fetcher } from '../lib/api'
import { AddInventoryModal } from '../components/AddInventoryModal'
import type { InventoryItem, Prescription } from '../lib/types'

type Tab = 'orders' | 'inventory'

const STATUS_COLORS: Record<string, string> = {
  'sent-to-chemist': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  packing: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  ready: 'bg-teal/10 text-teal',
  collected: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
}

export function ChemistDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('orders')
  const [showAddModal, setShowAddModal] = useState(false)
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null)
  const [restockQty, setRestockQty] = useState(50)

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['chemist-orders'],
    queryFn: () => fetcher<{ orders: Prescription[] }>('/chemist/orders'),
    refetchInterval: 10000
  })

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['chemist-inventory'],
    queryFn: () => fetcher<{ inventory: InventoryItem[] }>('/admin/inventory'),
    refetchInterval: 30000
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put('/chemist/status', { prescriptionId: id, status }),
    onSuccess: () => {
      toast.success('Order status updated')
      void queryClient.invalidateQueries({ queryKey: ['chemist-orders'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Update failed')
  })

  const restockMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api.put('/admin/inventory/qty', { itemId, quantity, mode: 'add' }),
    onSuccess: () => {
      toast.success('Stock updated')
      setRestockItem(null)
      void queryClient.invalidateQueries({ queryKey: ['chemist-inventory'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to update stock')
  })

  const pendingOrders = (ordersData?.orders ?? []).filter((o) => o.status !== 'collected')
  const inventory = inventoryData?.inventory ?? []
  const lowStockCount = inventory.filter((i) => i.quantity <= i.reorderLevel).length
  const inventoryByMedicineId = new Map(inventory.map((item) => [item.medicine?._id, item]))
  const inventoryByName = new Map(inventory.map((item) => [item.medicine?.name?.toLowerCase(), item]))
  const getStock = (medicine: Prescription['medicines'][number]) => {
    const medicineId = typeof medicine.medicine === 'object' ? medicine.medicine?._id : medicine.medicine
    return (medicineId ? inventoryByMedicineId.get(medicineId) : undefined) ?? inventoryByName.get(medicine.name.toLowerCase())
  }
  const getLineTotal = (medicine: Prescription['medicines'][number]) => {
    const stock = getStock(medicine)
    return Number(stock?.medicine?.price ?? 0) * Number(medicine.quantity || 0)
  }

  const tabs = [
    { id: 'orders' as Tab, label: 'Pharmacy Orders', icon: Pill, badge: pendingOrders.length },
    { id: 'inventory' as Tab, label: 'Inventory', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy</h1>
          <p className="text-sm text-slate-500">Receive prescriptions, pack medicines, and manage inventory.</p>
        </div>
        {activeTab === 'inventory' && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" /> Add to Inventory
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === id ? 'border-teal text-teal' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {badge != null && badge > 0 && (
              <span className={`rounded-full text-white text-xs px-1.5 py-0.5 leading-none ${id === 'inventory' ? 'bg-red-500' : 'bg-teal'}`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders */}
      {activeTab === 'orders' && (
        <>
          {ordersLoading && <div className="panel p-8 text-center text-slate-400">Loading orders…</div>}
          {!ordersLoading && (ordersData?.orders ?? []).length === 0 && (
            <div className="panel p-12 text-center">
              <Pill className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No pending pharmacy orders.</p>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {(ordersData?.orders ?? []).map((order) => {
              const medicineTotal = order.medicines.reduce((sum, item) => sum + getLineTotal(item), 0)
              const hasUnavailable = order.medicines.some((item) => {
                const stock = getStock(item)
                return !stock || stock.quantity < Number(item.quantity || 1)
              })
              return (
              <article key={order._id} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{typeof order.patient === 'object' ? order.patient.name : 'Patient'}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{order.diagnosis}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Medicine total: <span className="text-slate-900 dark:text-white">₹{medicineTotal}</span>
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${STATUS_COLORS[order.status] ?? ''}`}>
                    {order.status.replace(/-/g, ' ')}
                  </span>
                </div>
                {order.sentToChemistAt && (
                  <p className="text-xs text-slate-400 mt-2">Received: {new Date(order.sentToChemistAt).toLocaleString()}</p>
                )}
                <div className="mt-4 space-y-2">
                  {order.medicines.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex items-center gap-3 rounded-md border border-slate-200 dark:border-slate-800 p-3 text-sm">
                      <Pill className="h-4 w-4 text-teal shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.name} <span className="text-slate-400 font-normal">×{item.quantity}</span></p>
                        <p className="text-xs text-slate-500">{item.dosage} · {item.frequency} · {item.duration}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        getStock(item) && getStock(item)!.quantity >= Number(item.quantity || 1)
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {getStock(item) && getStock(item)!.quantity >= Number(item.quantity || 1)
                          ? `Available (${getStock(item)!.quantity})`
                          : 'Not available'}
                      </span>
                    </div>
                  ))}
                </div>
                {hasUnavailable && (
                  <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
                    One or more medicines are not available in the requested quantity. Restock before collection.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === 'sent-to-chemist' && (
                    <button className="btn-secondary flex items-center gap-1.5 text-sm" onClick={() => statusMutation.mutate({ id: order._id, status: 'packing' })} disabled={statusMutation.isPending}>
                      <PackageCheck className="h-4 w-4" /> Start Packing
                    </button>
                  )}
                  {(order.status === 'sent-to-chemist' || order.status === 'packing') && (
                    <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={() => statusMutation.mutate({ id: order._id, status: 'ready' })} disabled={statusMutation.isPending}>
                      <Check className="h-4 w-4" /> Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button className="btn-secondary flex items-center gap-1.5 text-sm text-green-600 border-green-200 dark:border-green-900 hover:bg-green-50 dark:hover:bg-green-950/20" onClick={() => statusMutation.mutate({ id: order._id, status: 'collected' })} disabled={statusMutation.isPending || hasUnavailable}>
                      <Check className="h-4 w-4" /> Confirm Collected
                    </button>
                  )}
                </div>
              </article>
              )
            })}
          </div>
        </>
      )}

      {/* Inventory */}
      {activeTab === 'inventory' && (
        <>
          {lowStockCount > 0 && (
            <div className="flex items-center gap-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
              <AlertTriangle className="h-5 w-5 text-amber shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>{lowStockCount}</strong> medicine{lowStockCount !== 1 ? 's are' : ' is'} below reorder level.
              </p>
            </div>
          )}
          <section className="panel overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
              <h2 className="font-semibold">Pharmacy Inventory ({inventory.length} items)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3">Qty in Stock</th>
                    <th className="p-3">Reorder Level</th>
                    <th className="p-3">Expiry</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLoading && <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading inventory…</td></tr>}
                  {!inventoryLoading && inventory.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-400">No inventory records. Add medicines using the button above.</td></tr>}
                  {inventory.map((item) => {
                    const isLow = item.quantity <= item.reorderLevel
                    const isExpiringSoon = item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    return (
                      <tr key={item._id} className={`border-t border-slate-100 dark:border-slate-800 ${isLow ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}>
                        <td className="p-3">
                          <p className="font-medium">{item.medicine?.name}</p>
                          <p className="text-xs text-slate-400">{item.medicine?.genericName}</p>
                        </td>
                        <td className="p-3 text-slate-500 capitalize">{item.medicine?.category ?? '—'}</td>
                        <td className="p-3 font-mono text-xs">{item.batchNo}</td>
                        <td className="p-3">
                          <span className={`font-bold text-base ${isLow ? 'text-red-600' : 'text-green-600'}`}>{item.quantity}</span>
                          <span className="text-xs text-slate-400 ml-1">{item.medicine?.unit}</span>
                        </td>
                        <td className="p-3 text-slate-500">{item.reorderLevel}</td>
                        <td className="p-3">
                          {item.expiryDate
                            ? <span className={`text-xs ${isExpiringSoon ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>{new Date(item.expiryDate).toLocaleDateString()}{isExpiringSoon && ' ⚠'}</span>
                            : '—'}
                        </td>
                        <td className="p-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isLow ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'}`}>
                            {isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            title="Restock — add units"
                            className="flex items-center gap-1 text-xs btn-secondary px-2 py-1 h-auto text-teal border-teal/30 hover:bg-teal/5"
                            onClick={() => { setRestockItem(item); setRestockQty(50) }}
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Restock
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {showAddModal && (
        <AddInventoryModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            void queryClient.invalidateQueries({ queryKey: ['chemist-inventory'] })
          }}
        />
      )}

      {/* ── Restock Modal ────────────────────────────────────────────── */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel w-full max-w-sm p-6 bg-white dark:bg-slate-900 shadow-xl rounded-lg space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-teal" /> Restock Medicine
            </h3>
            <div className="rounded-md bg-slate-50 dark:bg-slate-800 p-3 text-sm">
              <p className="font-semibold">{restockItem.medicine?.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">Batch: {restockItem.batchNo} · Current stock: <span className="font-bold">{restockItem.quantity}</span> {restockItem.medicine?.unit}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">Units to Add</label>
              <input
                type="number"
                min={1}
                className="field text-lg font-bold"
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
              />
              <p className="text-xs text-slate-400 mt-1">
                New total will be <span className="font-semibold text-teal">{restockItem.quantity + restockQty}</span> {restockItem.medicine?.unit}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setRestockItem(null)}>Cancel</button>
              <button
                className="btn-primary flex-1"
                disabled={restockMutation.isPending || restockQty < 1}
                onClick={() => restockMutation.mutate({ itemId: restockItem._id, quantity: restockQty })}
              >
                {restockMutation.isPending ? 'Updating…' : `Add ${restockQty} units`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
