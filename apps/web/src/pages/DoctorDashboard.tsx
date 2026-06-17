import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ClipboardList, History, Pill, Plus, Send, Stethoscope, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api, fetcher } from '../lib/api'
import type { Prescription, QueueItem } from '../lib/types'

type MedicineItem = {
  name: string
  dosage: string
  frequency: string
  duration: string
  quantity: number
  instructions: string
}

type Tab = 'queue' | 'history'

const PRESC_STATUS_COLORS: Record<string, string> = {
  'sent-to-chemist': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  packing: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  ready: 'bg-teal/10 text-teal',
  collected: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
}

export function DoctorDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('queue')
  const [active, setActive] = useState<QueueItem | undefined>()
  const [diagnosis, setDiagnosis] = useState('')
  const [instructions, setInstructions] = useState('')
  const [medicinesList, setMedicinesList] = useState<MedicineItem[]>([])
  const [medName, setMedName] = useState('')
  const [medDosage, setMedDosage] = useState('1 tablet')
  const [medFrequency, setMedFrequency] = useState('Twice daily')
  const [medDuration, setMedDuration] = useState('3 days')
  const [medQuantity, setMedQuantity] = useState(6)
  const [medInstructions, setMedInstructions] = useState('After food')

  const { data: queueData } = useQuery({
    queryKey: ['doctor-patients'],
    queryFn: () => fetcher<{ queue: QueueItem[] }>('/doctor/patients'),
    refetchInterval: 10000
  })

  const { data: allPrescriptions } = useQuery({
    queryKey: ['all-prescriptions'],
    queryFn: () => fetcher<{ orders: Prescription[] }>('/chemist/orders'),
    enabled: activeTab === 'history'
  })

  const { data: medicinesCatalog } = useQuery({
    queryKey: ['medicines-catalog'],
    queryFn: () => fetcher<{ medicines: any[] }>('/admin/medicines')
  })

  const updateStatus = async (status: string) => {
    try {
      await api.put('/queue/status', { queueId: active?._id, status })
      toast.success(`Status updated to: ${status.replace('-', ' ')}`)
      if (active) setActive({ ...active, status: status as any })
      void queryClient.invalidateQueries({ queryKey: ['doctor-patients'] })
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Failed to update status')
    }
  }

  const prescriptionMutation = useMutation({
    mutationFn: () =>
      api.post('/doctor/prescription', {
        patient: active?.patient?._id,
        diagnosis,
        instructions,
        doList: ['Drink plenty of fluids', 'Take rest'],
        dontList: ['Avoid cold drinks', 'Do not skip medicine'],
        medicines: medicinesList
      }),
    onSuccess: () => {
      toast.success('Prescription sent to pharmacy')
      setDiagnosis('')
      setInstructions('')
      setMedicinesList([])
      setActive(undefined)
      void queryClient.invalidateQueries({ queryKey: ['doctor-patients'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to send prescription')
  })

  const handleAddMedicine = () => {
    if (!medName.trim()) { toast.error('Enter a medicine name'); return }
    setMedicinesList([...medicinesList, { name: medName, dosage: medDosage, frequency: medFrequency, duration: medDuration, quantity: medQuantity, instructions: medInstructions }])
    setMedName('')
    setMedQuantity(6)
  }

  const tabs = [
    { id: 'queue' as Tab, label: 'Patient Queue', icon: ClipboardList, badge: queueData?.queue?.length },
    { id: 'history' as Tab, label: 'Prescription History', icon: History }
  ]

  return (
    <div className="space-y-6">
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
              <span className="rounded-full bg-teal text-white text-xs px-1.5 py-0.5 leading-none">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          {/* Queue list */}
          <section className="panel overflow-hidden self-start">
            <div className="border-b border-slate-200 p-4 dark:border-slate-800">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal" /> My Queue
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(queueData?.queue ?? []).map((item) => (
                <button
                  key={item._id}
                  onClick={() => {
                    setActive(item)
                    setMedicinesList([])
                    setDiagnosis('')
                    setInstructions('')
                  }}
                  className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition ${active?._id === item._id ? 'bg-teal/5 border-l-2 border-teal' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal">{item.token}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize font-medium ${
                      item.status === 'in-consultation' ? 'bg-teal text-white' :
                      item.status === 'called' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {item.status.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold text-sm">{item.patient?.name}</p>
                  <p className="text-xs text-slate-500">{item.patient?.age} yrs · {item.patient?.bloodGroup ?? 'N/A'}</p>
                  {item.patient?.allergies && item.patient.allergies.length > 0 && (
                    <p className="text-xs text-amber mt-1">⚠ {item.patient.allergies.join(', ')}</p>
                  )}
                </button>
              ))}
              {(queueData?.queue ?? []).length === 0 && (
                <p className="p-6 text-sm text-slate-400 text-center">No patients in queue.</p>
              )}
            </div>
          </section>

          {/* Consultation panel */}
          <section className="panel p-4">
            {active ? (
              <div className="space-y-5">
                {/* Patient header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold">{active.patient.name}</h2>
                    <p className="text-sm text-slate-500">{active.patient.phone} · {active.patient.departmentName ?? 'General'}</p>
                  </div>
                  <div className="flex gap-2">
                    {active.status === 'waiting' && (
                      <button className="btn-secondary text-sm" onClick={() => updateStatus('called')}>Call Patient</button>
                    )}
                    {active.status !== 'in-consultation' && (
                      <button className="btn-secondary flex items-center gap-1 text-sm" onClick={() => updateStatus('in-consultation')}>
                        <CheckCircle2 className="h-4 w-4" /> Start Consultation
                      </button>
                    )}
                  </div>
                </div>

                {/* Patient info strips */}
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
                    <p className="text-xs text-slate-500">Allergies</p>
                    <p className="text-sm font-medium">{active.patient.allergies?.join(', ') || 'None recorded'}</p>
                  </div>
                  <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
                    <p className="text-xs text-slate-500">Medical History</p>
                    <p className="text-sm font-medium">{active.patient.medicalHistory?.join(', ') || 'None recorded'}</p>
                  </div>
                  <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
                    <p className="text-xs text-slate-500">Queue Token</p>
                    <p className="text-sm font-medium">{active.token} · ~{active.estimatedWaitMinutes} min</p>
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Diagnosis *</label>
                  <textarea
                    className="textarea"
                    placeholder="Symptoms, assessment, primary diagnosis…"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">General Instructions</label>
                  <textarea
                    className="textarea"
                    placeholder="Dietary advice, do's & don'ts…"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>

                {/* Medicines */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-teal" />
                    <h3 className="font-semibold text-sm">Prescribed Medicines</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_120px_160px]">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Medicine Name</label>
                        <input
                          className="field bg-white dark:bg-slate-900"
                          value={medName}
                          onChange={(e) => setMedName(e.target.value)}
                          placeholder="Type or select"
                          list="medicines-list"
                        />
                        <datalist id="medicines-list">
                          {(medicinesCatalog?.medicines ?? []).map((m) => (
                            <option key={m._id} value={m.name} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Dosage</label>
                        <input className="field bg-white dark:bg-slate-900" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} placeholder="1 tablet" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Frequency</label>
                        <select className="field bg-white dark:bg-slate-900" value={medFrequency} onChange={(e) => setMedFrequency(e.target.value)}>
                          <option>Once daily</option>
                          <option>Twice daily</option>
                          <option>Thrice daily</option>
                          <option>Four times daily</option>
                          <option>Before sleep</option>
                          <option>As needed (SOS)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[140px_120px_1fr_auto] items-end">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Duration</label>
                        <input className="field bg-white dark:bg-slate-900" value={medDuration} onChange={(e) => setMedDuration(e.target.value)} placeholder="3 days" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Qty</label>
                        <input type="number" className="field bg-white dark:bg-slate-900" value={medQuantity} onChange={(e) => setMedQuantity(Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Instructions</label>
                        <input className="field bg-white dark:bg-slate-900" value={medInstructions} onChange={(e) => setMedInstructions(e.target.value)} placeholder="After food" />
                      </div>
                      <button type="button" onClick={handleAddMedicine} className="btn-secondary py-2.5 px-3 flex items-center gap-1 text-teal border-teal/30">
                        <Plus className="h-4 w-4" /> Add
                      </button>
                    </div>

                    {medicinesList.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                        {medicinesList.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-sm">
                            <div className="flex items-start gap-3">
                              <Pill className="h-4 w-4 text-teal mt-0.5" />
                              <div>
                                <p className="font-semibold">{item.name} <span className="text-xs font-normal text-slate-500">(x{item.quantity})</span></p>
                                <p className="text-xs text-slate-500">{item.dosage} · {item.frequency} · {item.duration} · <em>{item.instructions}</em></p>
                              </div>
                            </div>
                            <button type="button" onClick={() => setMedicinesList(medicinesList.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-1 rounded">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {medicinesList.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-2">No medicines added yet.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    className="btn-primary flex items-center gap-2"
                    onClick={() => prescriptionMutation.mutate()}
                    disabled={!diagnosis || medicinesList.length === 0 || prescriptionMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                    {prescriptionMutation.isPending ? 'Sending…' : 'Send Prescription to Pharmacy'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid min-h-96 place-items-center text-center text-slate-500">
                <div>
                  <Stethoscope className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-medium text-slate-600 dark:text-slate-400">Select a patient from the queue to start consultation.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-teal" /> Prescription History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Diagnosis</th>
                  <th className="p-3">Medicines</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {(allPrescriptions?.orders ?? []).map((presc) => (
                  <tr key={presc._id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">
                      <p className="font-medium">{typeof presc.patient === 'object' ? presc.patient.name : '—'}</p>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">{presc.diagnosis}</td>
                    <td className="p-3 text-slate-500">
                      {presc.medicines.slice(0, 2).map((m, i) => (
                        <span key={i} className="block text-xs">{m.name}</span>
                      ))}
                      {presc.medicines.length > 2 && <span className="text-xs text-slate-400">+{presc.medicines.length - 2} more</span>}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRESC_STATUS_COLORS[presc.status] ?? ''}`}>
                        {presc.status.replace(/-/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">{new Date(presc.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {(allPrescriptions?.orders ?? []).length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">No prescription history found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
