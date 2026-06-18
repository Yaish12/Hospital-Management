import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api, fetcher } from '../lib/api'
import type { Medicine } from '../lib/types'

type AddInventoryValues = {
  medicineId: string
  newMedicineName: string
  genericName: string
  category: string
  unit: string
  price: number
  batchNo: string
  quantity: number
  reorderLevel: number
  expiryDate: string
  location: string
}

type AddInventoryModalProps = {
  onClose: () => void
  onAdded?: () => void
}

export function AddInventoryModal({ onClose, onAdded }: AddInventoryModalProps) {
  const queryClient = useQueryClient()
  const [useNewMedicine, setUseNewMedicine] = useState(false)
  const { register, handleSubmit, reset } = useForm<AddInventoryValues>({
    defaultValues: { quantity: 100, reorderLevel: 20, unit: 'tablet', price: 0 }
  })

  const { data: medicinesData } = useQuery({
    queryKey: ['medicines-catalog'],
    queryFn: () => fetcher<{ medicines: Medicine[] }>('/admin/medicines')
  })

  const addInventoryMutation = useMutation({
    mutationFn: async (values: AddInventoryValues) => {
      let medicineId = values.medicineId

      if (useNewMedicine || !medicineId) {
        const { data } = await api.post('/admin/medicines', {
          name: values.newMedicineName,
          genericName: values.genericName,
          category: values.category,
          unit: values.unit,
          price: Number(values.price)
        })
        medicineId = data.medicine._id
      }

      return api.post('/admin/inventory', {
        medicine: medicineId,
        batchNo: values.batchNo,
        quantity: Number(values.quantity),
        reorderLevel: Number(values.reorderLevel),
        expiryDate: values.expiryDate || undefined,
        location: values.location
      })
    },
    onSuccess: () => {
      toast.success('Medicine added to inventory')
      reset()
      setUseNewMedicine(false)
      void queryClient.invalidateQueries({ queryKey: ['medicines-catalog'] })
      onAdded?.()
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to add inventory')
  })

  const close = () => {
    reset()
    setUseNewMedicine(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="panel w-full max-w-lg p-6 bg-white dark:bg-slate-900 shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Boxes className="h-5 w-5 text-teal" /> Add to Inventory
        </h3>
        <p className="text-sm text-slate-500 mb-5">Select an existing medicine or register a new one, then fill in batch details.</p>

        <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mb-5">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium transition ${!useNewMedicine ? 'bg-teal text-white' : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            onClick={() => setUseNewMedicine(false)}
          >
            Existing Medicine
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium transition ${useNewMedicine ? 'bg-teal text-white' : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            onClick={() => setUseNewMedicine(true)}
          >
            New Medicine
          </button>
        </div>

        <form onSubmit={handleSubmit((v) => addInventoryMutation.mutate(v))} className="space-y-4">
          {!useNewMedicine && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Select Medicine</label>
              <select className="field" {...register('medicineId', { required: !useNewMedicine })}>
                <option value="">Choose medicine...</option>
                {(medicinesData?.medicines ?? []).map((medicine) => (
                  <option key={medicine._id} value={medicine._id}>
                    {medicine.name} {medicine.genericName ? `(${medicine.genericName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {useNewMedicine && (
            <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <p className="text-xs font-bold text-teal">New Medicine Details</p>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Medicine Name *</label>
                <input className="field bg-white dark:bg-slate-900" placeholder="e.g. Amoxicillin 500mg" {...register('newMedicineName', { required: useNewMedicine })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Generic Name</label>
                  <input className="field bg-white dark:bg-slate-900" placeholder="e.g. Amoxicillin" {...register('genericName')} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Category</label>
                  <input className="field bg-white dark:bg-slate-900" placeholder="e.g. Antibiotic" {...register('category')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Unit</label>
                  <select className="field bg-white dark:bg-slate-900" {...register('unit')}>
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="bottle">Bottle</option>
                    <option value="vial">Vial</option>
                    <option value="sachet">Sachet</option>
                    <option value="ml">mL</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Price per unit (INR)</label>
                  <input type="number" className="field bg-white dark:bg-slate-900" placeholder="0" {...register('price', { valueAsNumber: true })} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Batch No *</label>
              <input className="field" placeholder="e.g. BCH-2026-01" {...register('batchNo', { required: true })} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Quantity *</label>
              <input type="number" className="field" placeholder="100" {...register('quantity', { required: true, valueAsNumber: true, min: 1 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Reorder Level</label>
              <input type="number" className="field" placeholder="20" {...register('reorderLevel', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Expiry Date</label>
              <input type="date" className="field" {...register('expiryDate')} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Storage Location</label>
            <input className="field" placeholder="e.g. Rack A, Shelf 2" {...register('location')} />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button type="button" className="btn-secondary" onClick={close}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={addInventoryMutation.isPending}>
              {addInventoryMutation.isPending ? 'Adding...' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
