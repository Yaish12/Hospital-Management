import { Building2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../lib/api'

type ForgotValues = { email: string }

export function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState } = useForm<ForgotValues>()

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post('/auth/forgot-password', values)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
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
            <p className="text-sm text-slate-500">Password recovery</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-4 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-lg font-bold">Check your email</h2>
            <p className="text-sm text-slate-500">
              If an account exists for that email, we sent a password reset token. Use it on the reset password page.
            </p>
            <Link to="/reset-password" className="btn-primary w-full flex justify-center">
              Go to Reset Password
            </Link>
            <Link to="/login" className="btn-secondary w-full flex justify-center items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-1">Forgot your password?</h2>
              <p className="text-sm text-slate-500">Enter your account email and we'll send you a reset token.</p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="field pl-9"
                  type="email"
                  placeholder="your@hospital.local"
                  {...register('email', { required: true })}
                />
              </div>
            </div>
            <button className="btn-primary w-full" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? 'Sending…' : 'Send Reset Token'}
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
