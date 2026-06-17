import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, Check, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { api, fetcher } from '../lib/api'
import type { Notification } from '../lib/types'

const TYPE_COLORS: Record<string, string> = {
  queue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  medicine: 'bg-teal/10 text-teal',
  billing: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  system: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

export function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: () => fetcher<{ notifications: Notification[] }>('/notifications')
  })

  const readMutation = useMutation({
    mutationFn: (notificationId?: string) =>
      api.put('/notifications/read', notificationId ? { notificationId } : {}),
    onSuccess: () => {
      toast.success('Marked as read')
      void queryClient.invalidateQueries({ queryKey: ['notifications-page'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to mark as read')
  })

  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-teal" /> Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-teal text-white text-xs px-2 py-0.5 font-medium">{unreadCount}</span>
            )}
          </h1>
          <p className="text-sm text-slate-500">All your system and queue notifications.</p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => readMutation.mutate(undefined)}
            disabled={readMutation.isPending}
          >
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      {isLoading && <div className="panel p-8 text-center text-slate-400">Loading notifications…</div>}

      {!isLoading && notifications.length === 0 && (
        <div className="panel p-12 text-center">
          <BellOff className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No notifications yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif._id}
            className={`panel p-4 flex items-start gap-4 transition ${!notif.readAt ? 'border-l-4 border-teal' : 'opacity-70'}`}
          >
            <div className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${TYPE_COLORS[notif.type] ?? 'bg-slate-100 text-slate-500'}`}>
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{notif.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{notif.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_COLORS[notif.type] ?? ''}`}>
                    {notif.type}
                  </span>
                  {!notif.readAt && (
                    <button
                      title="Mark as read"
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-teal"
                      onClick={() => readMutation.mutate(notif._id)}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs text-slate-400">{new Date(notif.createdAt).toLocaleString()}</p>
                {notif.readAt && <p className="text-xs text-slate-400">Read {new Date(notif.readAt).toLocaleString()}</p>}
                {!notif.readAt && <span className="h-2 w-2 rounded-full bg-teal inline-block" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
