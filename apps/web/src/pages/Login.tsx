import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Eye, EyeOff, Headphones, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from '../lib/api'
import type { User } from '../lib/types'
import { useAuthStore } from '../stores/auth-store'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

type FormValues = z.infer<typeof schema>

export function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@hospital.local', password: 'Password@123' }
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { data } = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', values)
      login(data.user, data.accessToken, data.refreshToken)
      navigate(`/${data.user.role}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Login failed')
    }
  })

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_520px] dark:bg-slate-950">
      <section className="hidden bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center lg:block" />
      <section className="flex items-center justify-center px-5 py-10">
        <form onSubmit={onSubmit} className="panel w-full max-w-md p-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-teal text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-950 dark:text-white">City Care HMS</h1>
              <p className="text-sm text-slate-500">Role based hospital workflow</p>
            </div>
          </div>
          <label className="text-sm font-medium">Email</label>
          <input className="field mt-1" autoComplete="email" {...register('email')} />
          {formState.errors.email && (
            <p className="mt-1 text-xs text-red-500">Enter a valid email address.</p>
          )}
          <label className="mt-4 block text-sm font-medium">Password</label>
          <div className="relative mt-1">
            <input
              className="field pr-10"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-teal dark:hover:bg-slate-800"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {formState.errors.password && (
            <p className="mt-1 text-xs text-red-500">Password must be at least 6 characters.</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal">
              <Headphones className="h-3.5 w-3.5" />
              Help desk
            </Link>
            <Link to="/forgot-password" className="text-xs text-teal hover:underline">Forgot password?</Link>
          </div>
          <button className="btn-primary mt-6 w-full" disabled={formState.isSubmitting}>
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
          <div className="mt-5 grid gap-2 rounded-md bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <span>admin@hospital.local</span>
            <span>reception@hospital.local</span>
            <span>doctor@hospital.local</span>
            <span>chemist@hospital.local</span>
            <span>patient@hospital.local</span>
            <strong>Password@123</strong>
          </div>
        </form>
      </section>
    </div>
  )
}
