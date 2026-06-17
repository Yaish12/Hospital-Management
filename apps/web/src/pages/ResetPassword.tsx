import { Building2, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../lib/api'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  token: z.string().min(10, 'Enter the token from your email'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
})

type FormValues = z.infer<typeof schema>

export function ResetPassword() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post('/auth/reset-password', values)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Invalid or expired token.')
    }
  })

  return (
    <div className="grid min-h-screen bg-slate-50 dark:bg-slate-950 place-items-center px-5">
      <div className="panel w-full max-w-md p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-teal text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">City Care HMS</h1>
            <p className="text-sm text-slate-500">Reset password</p>
          </div>
        </div>

        {done ? (
          <div className="text-center py-4 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-lg font-bold">Password reset complete</h2>
            <p className="text-sm text-slate-500">Redirecting you to login…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-1">Reset your password</h2>
              <p className="text-sm text-slate-500">Enter the token we sent to your email along with your new password.</p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Email address</label>
              <input
                className="field"
                type="email"
                placeholder="your@hospital.local"
                {...register('email')}
              />
              {formState.errors.email && (
                <p className="text-xs text-red-500 mt-1">{formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Reset Token</label>
              <input
                className="field font-mono"
                placeholder="Paste token from email"
                {...register('token')}
              />
              {formState.errors.token && (
                <p className="text-xs text-red-500 mt-1">{formState.errors.token.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">New Password</label>
              <div className="relative">
                <input
                  className="field pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 chars, uppercase + number"
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formState.errors.newPassword && (
                <p className="text-xs text-red-500 mt-1">{formState.errors.newPassword.message}</p>
              )}
            </div>

            <button className="btn-primary w-full" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? 'Resetting…' : 'Reset Password'}
            </button>

            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition">
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
