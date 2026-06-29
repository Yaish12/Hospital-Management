import { Bell, CalendarDays, ClipboardList, CreditCard, FlaskConical, Headphones, LogIn, Pill, ShieldCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetcher } from '../lib/api'

const helpDeskItems = [
  'Patient registration and queue token support',
  'Doctor consultation, prescription, and report guidance',
  'Billing, payment, and pharmacy pickup coordination'
]

const labTests = [
  'Complete Blood Count',
  'Blood Sugar Fasting/PP',
  'Liver Function Test',
  'Kidney Function Test',
  'Lipid Profile',
  'Thyroid Profile',
  'Urine Routine',
  'X-Ray / Radiology Report'
]

export function LandingPage() {
  const { data: health } = useQuery({
    queryKey: ['public-health'],
    queryFn: () => fetcher<{ ok: boolean; database?: string }>('/health'),
    retry: 1,
    refetchInterval: 30000
  })

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="relative min-h-[88vh] bg-[linear-gradient(90deg,rgba(15,23,42,0.86),rgba(15,23,42,0.42)),url('https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3 text-white">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-teal">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">City Care HMS</p>
              <p className="text-xs text-white/70">Hospital management system</p>
            </div>
          </div>
          <Link to="/login" className="btn-primary">
            <LogIn className="h-4 w-4" />
            Staff Login
          </Link>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-10 pt-12 md:pt-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl text-white">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">City Care HMS</h1>
            <p className="mt-5 max-w-2xl text-lg text-white/82">
              A connected front desk, doctor, chemist, lab report, queue, billing, inventory, and patient portal workflow.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm text-white">
              <span className={`h-2.5 w-2.5 rounded-full ${health?.database === 'connected' ? 'bg-green-400' : 'bg-amber-300'}`} />
              API {health?.ok ? 'online' : 'checking'} · DB {health?.database ?? 'checking'}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary">
                <LogIn className="h-4 w-4" />
                Open Dashboard
              </Link>
              <a href="#help-desk" className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Headphones className="h-4 w-4" />
                Patient Help Desk
              </a>
            </div>
          </div>

          <div id="help-desk" className="grid gap-3 self-end">
            <div className="panel border-white/10 bg-white/95 p-4 shadow-xl dark:bg-slate-900/95">
              <h2 className="flex items-center gap-2 font-bold">
                <Headphones className="h-5 w-5 text-teal" />
                Patient Help Desk
              </h2>
              <div className="mt-4 grid gap-2">
                {helpDeskItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-md bg-slate-100 p-3 text-sm dark:bg-slate-800">
                    <Bell className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="panel bg-white/95 p-4 dark:bg-slate-900/95">
                <ClipboardList className="mb-3 h-5 w-5 text-amber" />
                <p className="text-xs text-slate-500">Live Queue</p>
                <p className="font-semibold">Token updates</p>
              </div>
              <div className="panel bg-white/95 p-4 dark:bg-slate-900/95">
                <CreditCard className="mb-3 h-5 w-5 text-coral" />
                <p className="text-xs text-slate-500">Billing</p>
                <p className="font-semibold">Cash / UPI / Card</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-4">
        <div className="panel p-4">
          <CalendarDays className="mb-3 h-5 w-5 text-teal" />
          <h2 className="font-semibold">Appointments</h2>
          <p className="mt-1 text-sm text-slate-500">Walk-in and scheduled patient tracking.</p>
        </div>
        <div className="panel p-4">
          <Pill className="mb-3 h-5 w-5 text-teal" />
          <h2 className="font-semibold">Pharmacy</h2>
          <p className="mt-1 text-sm text-slate-500">Medicine availability and inventory updates.</p>
        </div>
        <div className="panel p-4">
          <FlaskConical className="mb-3 h-5 w-5 text-coral" />
          <h2 className="font-semibold">Laboratory Tests</h2>
          <p className="mt-1 text-sm text-slate-500">{labTests.slice(0, 4).join(', ')}.</p>
        </div>
        <div className="panel p-4">
          <Bell className="mb-3 h-5 w-5 text-amber" />
          <h2 className="font-semibold">Alerts</h2>
          <p className="mt-1 text-sm text-slate-500">Popup and sound alerts for key updates.</p>
        </div>
      </section>
    </main>
  )
}
