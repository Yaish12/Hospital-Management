import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckCircle2, Plus, XCircle, Clock, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api, fetcher } from '../lib/api'
import type { Appointment } from '../lib/types'

type CreateValues = {
  patient: string
  doctor: string
  department: string
  scheduledAt: string
  reason: string
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  'checked-in': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
}

export function AppointmentsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', statusFilter, dateFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (dateFilter) params.set('date', dateFilter)
      return fetcher<{ appointments: Appointment[] }>(`/appointments?${params}`)
    },
    refetchInterval: 15000
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => fetcher<{ patients: any[] }>('/patients')
  })

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => fetcher<{ doctors: any[] }>('/admin/doctors')
  })

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => fetcher<{ departments: any[] }>('/admin/departments')
  })

  const { register, handleSubmit, reset } = useForm<CreateValues>()

  const createMutation = useMutation({
    mutationFn: (values: CreateValues) => api.post('/appointments', values),
    onSuccess: () => {
      toast.success('Appointment scheduled and queue token assigned')
      reset()
      setIsModalOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to create appointment')
  })

  const statusMutation = useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: string }) =>
      api.put('/appointments/status', { appointmentId, status }),
    onSuccess: () => {
      toast.success('Appointment status updated')
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to update status')
  })

  const appointments = data?.appointments ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-sm text-slate-500">Schedule, track and manage all patient appointments.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 panel p-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            className="field w-auto"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <select
          className="field w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="checked-in">Checked In</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {(statusFilter || dateFilter) && (
          <button
            className="btn-secondary text-xs px-3"
            onClick={() => { setStatusFilter(''); setDateFilter('') }}
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-slate-500 self-center">{appointments.length} result{appointments.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3">Patient</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Department</th>
                <th className="p-3">Scheduled</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading appointments…</td>
                </tr>
              )}
              {!isLoading && appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No appointments found.</td>
                </tr>
              )}
              {appointments.map((appt) => {
                const patient = typeof appt.patient === 'object' ? appt.patient : null
                const doctor = typeof appt.doctor === 'object' && appt.doctor ? appt.doctor : null
                const dept = typeof appt.department === 'object' && appt.department ? appt.department : null
                return (
                  <tr key={appt._id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-teal/10 grid place-items-center">
                          <User className="h-3.5 w-3.5 text-teal" />
                        </div>
                        <div>
                          <p className="font-medium">{patient?.name ?? '-'}</p>
                          <p className="text-xs text-slate-400">{patient?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{doctor?.user?.name ?? '-'}</p>
                      <p className="text-xs text-slate-400">{doctor?.specialization}</p>
                    </td>
                    <td className="p-3 text-slate-500">{dept?.name ?? '-'}</td>
                    <td className="p-3 whitespace-nowrap">
                      <p>{new Date(appt.scheduledAt).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-400">{new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{appt.reason ?? '-'}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[appt.status] ?? ''}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {appt.status === 'scheduled' && (
                          <button
                            title="Check In"
                            className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600"
                            onClick={() => statusMutation.mutate({ appointmentId: appt._id, status: 'checked-in' })}
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        )}
                        {(appt.status === 'scheduled' || appt.status === 'checked-in') && (
                          <>
                            <button
                              title="Mark Completed"
                              className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600"
                              onClick={() => statusMutation.mutate({ appointmentId: appt._id, status: 'completed' })}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              title="Cancel"
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                              onClick={() => statusMutation.mutate({ appointmentId: appt._id, status: 'cancelled' })}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel w-full max-w-lg p-6 bg-white dark:bg-slate-900 shadow-xl rounded-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-teal" /> Schedule Appointment
            </h3>
            <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Patient</label>
                <select className="field" {...register('patient', { required: true })}>
                  <option value="">Select patient</option>
                  {(patientsData?.patients ?? []).map((p) => (
                    <option key={p._id} value={p._id}>{p.name} — {p.phone}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Doctor</label>
                  <select className="field" {...register('doctor', { required: true })}>
                    <option value="">Select doctor</option>
                    {(doctorsData?.doctors ?? []).map((d) => (
                      <option key={d._id} value={d._id}>{d.user?.name} — {d.specialization}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Department</label>
                  <select className="field" {...register('department')}>
                    <option value="">Select department</option>
                    {(deptsData?.departments ?? []).map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Date & Time</label>
                <input type="datetime-local" className="field" {...register('scheduledAt', { required: true })} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Reason for Visit</label>
                <textarea className="textarea" placeholder="Describe the reason for this appointment…" {...register('reason')} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Scheduling…' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
