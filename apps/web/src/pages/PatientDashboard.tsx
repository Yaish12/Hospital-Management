import { useQuery } from '@tanstack/react-query'
import { Bell, CalendarDays, Clock, CreditCard, FileText, Pill } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetcher } from '../lib/api'
import type { Appointment, Prescription, QueueItem } from '../lib/types'

type PatientHome = {
  patient?: any
  queue?: QueueItem
  prescriptions: Prescription[]
  bills: any[]
  reports: any[]
  appointments: Appointment[]
}

const APPT_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  'checked-in': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
}

const PRESC_STATUS_COLORS: Record<string, string> = {
  'sent-to-chemist': 'bg-blue-100 text-blue-700',
  packing: 'bg-amber-100 text-amber-700',
  ready: 'bg-teal/10 text-teal font-semibold',
  collected: 'bg-green-100 text-green-700'
}

export function PatientDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['patient-home'],
    queryFn: () => fetcher<PatientHome>('/patient/home'),
    refetchInterval: 15000
  })

  // Notification unread count
  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => fetcher<{ notifications: any[] }>('/notifications'),
    refetchInterval: 30000
  })
  const unreadCount = (notifData?.notifications ?? []).filter((n) => !n.readAt).length

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading your dashboard…</div>
  }

  const upcomingAppts = (data?.appointments ?? []).filter((a) => a.status !== 'completed' && a.status !== 'cancelled')
  const pastAppts = (data?.appointments ?? []).filter((a) => a.status === 'completed' || a.status === 'cancelled')

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Hello, {data?.patient?.name ?? 'Patient'}</h1>
            <p className="text-sm text-slate-500">Patient ID: {data?.patient?.patientId ?? '—'}</p>
            {data?.patient?.departmentName && (
              <p className="text-sm text-slate-500">Department: {data.patient.departmentName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Link
                to="/notifications"
                className="relative btn-secondary flex items-center gap-2 pr-4"
              >
                <Bell className="h-4 w-4" />
                <span className="text-sm">Notifications</span>
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-coral text-white text-xs grid place-items-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </Link>
            )}
            {data?.queue && (
              <div className="rounded-md bg-teal px-5 py-3 text-white text-center">
                <p className="text-xs opacity-80">Queue Token</p>
                <p className="text-2xl font-bold">{data.queue.token}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Status cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-4">
          <Clock className="mb-3 h-5 w-5 text-amber" />
          <p className="text-sm text-slate-500">Queue position</p>
          <p className="text-2xl font-bold">{data?.queue?.position ?? '—'}</p>
          <p className="text-sm text-slate-500 mt-1">{data?.queue ? `~${data.queue.estimatedWaitMinutes} min wait` : 'Not in queue'}</p>
          {data?.queue?.status && (
            <p className="text-xs mt-2 capitalize font-medium text-teal">{data.queue.status.replace('-', ' ')}</p>
          )}
        </div>
        <div className="panel p-4">
          <CalendarDays className="mb-3 h-5 w-5 text-teal" />
          <p className="text-sm text-slate-500">Upcoming appointments</p>
          <p className="text-2xl font-bold">{upcomingAppts.length}</p>
          {upcomingAppts[0] && (
            <p className="text-xs mt-2 text-slate-500">{new Date(upcomingAppts[0].scheduledAt).toLocaleDateString()}</p>
          )}
        </div>
        <div className="panel p-4">
          <CreditCard className="mb-3 h-5 w-5 text-coral" />
          <p className="text-sm text-slate-500">Latest bill</p>
          <p className="text-2xl font-bold">₹{data?.bills?.[0]?.total ?? 0}</p>
          <p className="text-sm mt-1 capitalize font-medium">
            <span className={data?.bills?.[0]?.status === 'paid' ? 'text-green-600' : 'text-red-500'}>
              {data?.bills?.[0]?.status ?? 'No bills'}
            </span>
          </p>
        </div>
      </section>

      {/* Appointments */}
      <section className="panel overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-teal" /> My Appointments
          </h2>
        </div>
        {(data?.appointments ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No appointments scheduled.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...upcomingAppts, ...pastAppts].map((appt) => {
                  const doctor = typeof appt.doctor === 'object' && appt.doctor ? appt.doctor : null
                  const dept = typeof appt.department === 'object' && appt.department ? appt.department : null
                  return (
                    <tr key={appt._id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="p-3">
                        <p className="font-medium">{doctor?.user?.name ?? 'TBD'}</p>
                        <p className="text-xs text-slate-400">{doctor?.specialization}</p>
                      </td>
                      <td className="p-3 text-slate-500">{dept?.name ?? '—'}</td>
                      <td className="p-3">
                        <p>{new Date(appt.scheduledAt).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-400">{new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="p-3 text-slate-500 max-w-[140px] truncate">{appt.reason ?? '—'}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${APPT_STATUS_COLORS[appt.status] ?? ''}`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Prescriptions and Reports */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Prescriptions */}
        <div className="panel p-4">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Pill className="h-4 w-4 text-teal" /> Prescriptions
          </h2>
          {(data?.prescriptions ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No prescriptions yet.</p>
          ) : (
            <div className="space-y-3">
              {(data?.prescriptions ?? []).map((presc) => (
                <div key={presc._id} className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{presc.diagnosis}</p>
                      {presc.instructions && (
                        <p className="text-xs text-slate-500 mt-1">{presc.instructions}</p>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs shrink-0 ${PRESC_STATUS_COLORS[presc.status] ?? ''}`}>
                      {presc.status === 'ready' ? '✓ Ready' : presc.status.replace(/-/g, ' ')}
                    </span>
                  </div>
                  {presc.medicines.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {presc.medicines.map((m, i) => (
                        <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">{m.name}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2">{new Date(presc.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reports */}
        <div className="panel p-4">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4 text-coral" /> My Reports
          </h2>
          {(data?.reports ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No reports available.</p>
          ) : (
            <div className="space-y-3">
              {(data?.reports ?? []).map((report) => {
                const apiBase = import.meta.env.VITE_API_URL ?? '/api'
                const fileBase = apiBase.replace('/api', '')
                const fileUrl = report.fileUrl?.startsWith('http') ? report.fileUrl : `${fileBase}${report.fileUrl}`
                return (
                  <a
                    key={report._id}
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md border border-slate-200 dark:border-slate-800 p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <FileText className="h-4 w-4 text-coral shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{report.title}</p>
                      <p className="text-xs text-slate-400 capitalize">{report.type} · {new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
