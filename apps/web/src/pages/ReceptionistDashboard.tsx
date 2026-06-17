import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckCircle2, Clock, Copy, KeyRound, Printer, Send, UserRoundPlus, XCircle } from 'lucide-react'
import { type ElementType, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api, fetcher } from '../lib/api'
import type { Appointment, QueueItem } from '../lib/types'

type RegisterValues = {
  name: string
  email?: string
  phone: string
  age?: number
  gender?: string
  bloodGroup?: string
  address?: string
  reason?: string
  department?: string
  doctor?: string
}

type NewPatientCredentials = {
  patientMongoId: string
  name: string
  patientId: string
  email: string
  password: string
  token: string
  queuePosition: number
}

const APPT_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  'checked-in': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
}

type Tab = 'register' | 'queue' | 'appointments'

export function ReceptionistDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('register')
  const [credentials, setCredentials] = useState<NewPatientCredentials | null>(null)
  const { register, handleSubmit, reset } = useForm<RegisterValues>()

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => fetcher<{ departments: any[] }>('/admin/departments')
  })
  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => fetcher<{ doctors: any[] }>('/admin/doctors')
  })
  const { data: queueData } = useQuery({
    queryKey: ['queue'],
    queryFn: () => fetcher<{ queue: QueueItem[] }>('/queue'),
    refetchInterval: 10000
  })
  const { data: apptData } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => fetcher<{ appointments: Appointment[] }>('/appointments'),
    refetchInterval: 15000,
    enabled: activeTab === 'appointments'
  })

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterValues) => (await api.post('/patients', values)).data,
    onSuccess: (data) => {
      reset()
      void queryClient.invalidateQueries({ queryKey: ['queue'] })
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
      // Show credentials popup instead of just a toast
      setCredentials({
        patientMongoId: data.patient._id,
        name: data.patient.name,
        patientId: data.patient.patientId,
        email: data.credentials.email,
        password: data.credentials.password,
        token: data.queue.token,
        queuePosition: data.queue.position
      })
    },
    onError: (error: any) => toast.error(error.response?.data?.message ?? 'Registration failed')
  })

  const apptStatusMutation = useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: string }) =>
      api.put('/appointments/status', { appointmentId, status }),
    onSuccess: () => {
      toast.success('Appointment updated')
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Update failed')
  })

  const queueStatusMutation = useMutation({
    mutationFn: ({ queueId, status }: { queueId: string; status: string }) =>
      api.put('/queue/status', { queueId, status }),
    onSuccess: () => {
      toast.success('Queue updated')
      void queryClient.invalidateQueries({ queryKey: ['queue'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Update failed')
  })

  const tabs: { id: Tab; label: string; icon: ElementType; badge?: number }[] = [
    { id: 'register', label: 'Register Patient', icon: UserRoundPlus },
    { id: 'queue', label: 'Live Queue', icon: Clock, badge: queueData?.queue?.filter(q => ['waiting','called','in-consultation'].includes(q.status)).length },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reception</h1>
        <p className="text-sm text-slate-500">Register patients, manage queue, and track appointments.</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'border-teal text-teal'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
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

      {/* Register Patient */}
      {activeTab === 'register' && (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="panel p-4">
            <h2 className="flex items-center gap-2 text-lg font-bold mb-5">
              <UserRoundPlus className="h-5 w-5 text-teal" /> New Patient
            </h2>
            <form className="grid gap-4" onSubmit={handleSubmit((v) => registerMutation.mutate(v))}>
              <input className="field" placeholder="Full name *" {...register('name', { required: true })} />
              <input className="field" placeholder="Phone *" {...register('phone', { required: true })} />
              <input className="field" type="email" placeholder="Email (optional)" {...register('email')} />
              <div className="grid grid-cols-2 gap-3">
                <input className="field" type="number" placeholder="Age" {...register('age', { valueAsNumber: true })} />
                <select className="field" {...register('gender')}>
                  <option value="">Gender</option>
                  <option>male</option>
                  <option>female</option>
                  <option>other</option>
                </select>
              </div>
              <input className="field" placeholder="Blood group (e.g. B+)" {...register('bloodGroup')} />
              <textarea className="textarea" placeholder="Address" {...register('address')} />
              <select className="field" {...register('department')}>
                <option value="">Department</option>
                {(departments?.departments ?? []).map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              <select className="field" {...register('doctor')}>
                <option value="">Assign doctor</option>
                {(doctors?.doctors ?? []).map((d) => (
                  <option key={d._id} value={d._id}>{d.user?.name} — {d.specialization}</option>
                ))}
              </select>
              <textarea className="textarea" placeholder="Reason for visit" {...register('reason')} />
              <button className="btn-primary" disabled={registerMutation.isPending}>
                <Send className="h-4 w-4" />
                {registerMutation.isPending ? 'Registering…' : 'Register & Assign Queue Token'}
              </button>
            </form>
          </section>

          <section className="panel overflow-hidden self-start">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <h2 className="font-semibold">Today's Queue Preview</h2>
              <Printer className="h-4 w-4 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-3">Token</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Wait</th>
                  </tr>
                </thead>
                <tbody>
                  {(queueData?.queue ?? []).slice(0, 10).map((item) => (
                    <tr key={item._id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="p-3 font-bold text-teal">{item.token}</td>
                      <td className="p-3">{item.patient?.name}</td>
                      <td className="p-3 capitalize">{item.status}</td>
                      <td className="p-3 text-slate-500">{item.estimatedWaitMinutes} min</td>
                    </tr>
                  ))}
                  {(queueData?.queue ?? []).length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center text-slate-400 text-xs">No queue entries yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Live Queue */}
      {activeTab === 'queue' && (
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-semibold">Live Queue — {queueData?.queue?.length ?? 0} entries</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3">Token</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Wait</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(queueData?.queue ?? []).map((item) => (
                  <tr key={item._id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-teal">{item.token}</td>
                    <td className="p-3">
                      <p className="font-medium">{item.patient?.name}</p>
                      <p className="text-xs text-slate-400">{item.patient?.phone}</p>
                    </td>
                    <td className="p-3 text-slate-500">{item.doctor?.user?.name ?? '—'}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        item.status === 'waiting' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                        item.status === 'called' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                        item.status === 'in-consultation' ? 'bg-teal/10 text-teal' :
                        item.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' :
                        'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {item.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{item.estimatedWaitMinutes} min</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {['waiting', 'called', 'in-consultation'].includes(item.status) && (
                          <>
                            <button
                              title="Mark completed"
                              className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600"
                              onClick={() => queueStatusMutation.mutate({ queueId: item._id, status: 'completed' })}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              title="Cancel"
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                              onClick={() => queueStatusMutation.mutate({ queueId: item._id, status: 'cancelled' })}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(queueData?.queue ?? []).length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">Queue is empty.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Appointments */}
      {activeTab === 'appointments' && (
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold">All Appointments</h2>
            <a href="/appointments" className="text-xs text-teal hover:underline">Full view →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Scheduled</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(apptData?.appointments ?? []).map((appt) => {
                  const patient = typeof appt.patient === 'object' ? appt.patient : null
                  const doctor = typeof appt.doctor === 'object' && appt.doctor ? appt.doctor : null
                  return (
                    <tr key={appt._id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3">
                        <p className="font-medium">{patient?.name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{patient?.phone}</p>
                      </td>
                      <td className="p-3 text-slate-500">{doctor?.user?.name ?? '—'}</td>
                      <td className="p-3 text-xs">
                        <p>{new Date(appt.scheduledAt).toLocaleDateString()}</p>
                        <p className="text-slate-400">{new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="p-3 text-slate-500 max-w-[160px] truncate">{appt.reason ?? '—'}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${APPT_STATUS_COLORS[appt.status] ?? ''}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {appt.status === 'scheduled' && (
                            <button
                              title="Check In"
                              className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600"
                              onClick={() => apptStatusMutation.mutate({ appointmentId: appt._id, status: 'checked-in' })}
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          )}
                          {['scheduled', 'checked-in'].includes(appt.status) && (
                            <button
                              title="Cancel"
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                              onClick={() => apptStatusMutation.mutate({ appointmentId: appt._id, status: 'cancelled' })}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(apptData?.appointments ?? []).length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">No appointments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── New Patient Credentials Popup ──────────────────────────── */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-2xl rounded-xl space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-green-100 dark:bg-green-950/40 grid place-items-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Patient Registered!</h3>
                <p className="text-sm text-slate-500">Share these login details with the patient.</p>
              </div>
            </div>

            {/* Queue token highlight */}
            <div className="flex items-center justify-between rounded-lg bg-teal px-5 py-4 text-white">
              <div>
                <p className="text-xs opacity-75 font-medium uppercase tracking-wider">Queue Token</p>
                <p className="text-3xl font-bold mt-0.5">{credentials.token}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-75">Position</p>
                <p className="text-2xl font-bold">#{credentials.queuePosition}</p>
              </div>
            </div>

            {/* Credentials */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
              {/* Patient name + ID */}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Patient</p>
                  <p className="font-semibold">{credentials.name}</p>
                </div>
                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{credentials.patientId}</span>
              </div>

              {/* Email row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-medium">Login Email</p>
                  <p className="font-mono text-sm truncate">{credentials.email}</p>
                </div>
                <button
                  className="ml-3 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-teal transition shrink-0"
                  title="Copy email"
                  onClick={() => { void navigator.clipboard.writeText(credentials.email); toast.success('Email copied') }}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              {/* Password row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><KeyRound className="h-3 w-3" /> Temporary Password</p>
                  <p className="font-mono text-sm font-bold text-teal">{credentials.password}</p>
                </div>
                <button
                  className="ml-3 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-teal transition shrink-0"
                  title="Copy password"
                  onClick={() => { void navigator.clipboard.writeText(credentials.password); toast.success('Password copied') }}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">The patient can change their password after logging in from Settings.</p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
                onClick={() => {
                  const apiBase = import.meta.env.VITE_API_URL ?? '/api'
                  window.open(`${apiBase}/patients/${credentials.patientMongoId}/slip`, '_blank')
                }}
              >
                <Printer className="h-4 w-4" /> Print Slip
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => setCredentials(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
