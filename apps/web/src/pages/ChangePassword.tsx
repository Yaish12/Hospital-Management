import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth-store'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string()
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

type FormValues = z.infer<typeof schema>

export function ChangePassword() {
  const { user } = useAuthStore()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      toast.success('Password changed successfully')
      setDone(true)
      reset()
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to change password')
    }
  })

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-sm text-slate-500">Manage your account password and security.</p>
      </div>

      {/* Profile Card */}
      <div className="panel p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-teal/10 grid place-items-center">
          <span className="text-lg font-bold text-teal">{user?.name?.[0]?.toUpperCase()}</span>
        </div>
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <span className="inline-block mt-1 rounded-full bg-teal/10 text-teal text-xs px-2 py-0.5 capitalize">{user?.role}</span>
        </div>
      </div>

      {/* Change Password */}
      <div className="panel p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-5">
          <KeyRound className="h-4 w-4 text-teal" /> Change Password
        </h2>

        {done && (
          <div className="mb-4 flex items-center gap-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">Password changed successfully. Use your new password next time you log in.</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Current Password</label>
            <div className="relative">
              <input
                className="field pr-10"
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter current password"
                {...register('currentPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formState.errors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">{formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">New Password</label>
            <div className="relative">
              <input
                className="field pr-10"
                type={showNew ? 'text' : 'password'}
                placeholder="Min. 8 chars, uppercase + number"
                {...register('newPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formState.errors.newPassword && (
              <p className="text-xs text-red-500 mt-1">{formState.errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Confirm New Password</label>
            <input
              className="field"
              type="password"
              placeholder="Repeat new password"
              {...register('confirmPassword')}
            />
            {formState.errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="pt-2">
            <button className="btn-primary" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel p-4 text-xs text-slate-400 space-y-1">
        <p>Password requirements:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>At least 8 characters</li>
          <li>At least one uppercase letter</li>
          <li>At least one number</li>
        </ul>
      </div>
    </div>
  )
}
