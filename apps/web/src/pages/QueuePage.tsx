import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, PhoneCall, Stethoscope, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { api, fetcher } from '../lib/api'
import type { QueueItem } from '../lib/types'

const STATUS_COLORS: Record<string, string> = {
  waiting: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  called: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  'in-consultation': 'bg-teal/10 text-teal',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
}

export function QueuePage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['queue-full'],
    queryFn: () => fetcher<{ queue: QueueItem[] }>('/queue'),
    refetchInterval: 8000
  })

  const statusMutation = useMutation({
    mutationFn: ({ queueId, status }: { queueId: string; status: string }) =>
      api.put('/queue/status', { queueId, status }),
    onSuccess: () => {
      toast.success('Queue status updated')
      void queryClient.invalidateQueries({ queryKey: ['queue-full'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to update status')
  })

  const queue = data?.queue ?? []
  const active = queue.filter((q) => ['waiting', 'called', 'in-consultation'].includes(q.status))
  const done = queue.filter((q) => ['completed', 'cancelled'].includes(q.status))

  const stats = {
    waiting: queue.filter((q) => q.status === 'waiting').length,
    called: queue.filter((q) => q.status === 'called').length,
    inConsultation: queue.filter((q) => q.status === 'in-consultation').length,
    completed: queue.filter((q) => q.status === 'completed').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live Queue</h1>
          <p className="text-sm text-slate-500">Real-time patient queue management. Updates every 8 seconds.</p>
        </div>
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['queue-full'] })}
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="panel p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.waiting}</p>
          <p className="text-xs text-slate-500 mt-1">Waiting</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="text-2xl font-bold text-amber">{stats.called}</p>
          <p className="text-xs text-slate-500 mt-1">Called</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="text-2xl font-bold text-teal">{stats.inConsultation}</p>
          <p className="text-xs text-slate-500 mt-1">In Consultation</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-slate-500 mt-1">Completed Today</p>
        </div>
      </div>

      {/* Active Queue */}
      <section>
        <h2 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-teal" /> Active Queue ({active.length})
        </h2>
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3">Token</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Est. Wait</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading queue…</td></tr>
                )}
                {!isLoading && active.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">Queue is empty.</td></tr>
                )}
                {active.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">
                      <span className="font-bold text-teal text-base">{item.token}</span>
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{item.patient?.name}</p>
                      <p className="text-xs text-slate-400">{item.patient?.phone}</p>
                    </td>
                    <td className="p-3 text-slate-500">{item.doctor?.user?.name ?? '—'}</td>
                    <td className="p-3 text-slate-500">{item.department?.name ?? '—'}</td>
                    <td className="p-3 text-slate-500">{item.estimatedWaitMinutes} min</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[item.status] ?? ''}`}>
                        {item.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {item.status === 'waiting' && (
                          <button
                            title="Call Patient"
                            className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600"
                            onClick={() => statusMutation.mutate({ queueId: item._id, status: 'called' })}
                          >
                            <PhoneCall className="h-4 w-4" />
                          </button>
                        )}
                        {item.status === 'called' && (
                          <button
                            title="Start Consultation"
                            className="p-1.5 rounded hover:bg-teal/10 text-teal"
                            onClick={() => statusMutation.mutate({ queueId: item._id, status: 'in-consultation' })}
                          >
                            <Stethoscope className="h-4 w-4" />
                          </button>
                        )}
                        {(item.status === 'waiting' || item.status === 'called' || item.status === 'in-consultation') && (
                          <>
                            <button
                              title="Mark Completed"
                              className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600"
                              onClick={() => statusMutation.mutate({ queueId: item._id, status: 'completed' })}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              title="Cancel"
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                              onClick={() => statusMutation.mutate({ queueId: item._id, status: 'cancelled' })}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Completed/Cancelled */}
      {done.length > 0 && (
        <section>
          <h2 className="font-semibold text-slate-500 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Completed / Cancelled ({done.length})
          </h2>
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="p-3">Token</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {done.map((item) => (
                    <tr key={item._id} className="border-t border-slate-100 dark:border-slate-800 opacity-70">
                      <td className="p-3 font-mono font-semibold">{item.token}</td>
                      <td className="p-3">{item.patient?.name}</td>
                      <td className="p-3 text-slate-500">{item.doctor?.user?.name ?? '—'}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[item.status] ?? ''}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-xs">
                        {item.completedAt ? new Date(item.completedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
