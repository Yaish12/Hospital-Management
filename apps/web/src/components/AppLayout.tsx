import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  ClipboardList,
  IndianRupee,
  KeyRound,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UserRoundPlus,
  Users,
  FileText
} from 'lucide-react'
import { type ElementType, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { api, fetcher } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../stores/auth-store'
import type { Notification } from '../lib/types'

type NavEntry = { label: string; href: string; icon: ElementType }

const NAV: Record<string, NavEntry[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin', icon: Activity },
    { label: 'Patients', href: '/patients', icon: Users },
    { label: 'Appointments', href: '/appointments', icon: CalendarDays },
    { label: 'Queue', href: '/queue', icon: ClipboardList },
    { label: 'Billing', href: '/billing', icon: IndianRupee },
    { label: 'Reports', href: '/reports', icon: FileText },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ],
  receptionist: [
    { label: 'Reception', href: '/receptionist', icon: UserRoundPlus },
    { label: 'Patients', href: '/patients', icon: Users },
    { label: 'Appointments', href: '/appointments', icon: CalendarDays },
    { label: 'Queue', href: '/queue', icon: ClipboardList },
    { label: 'Billing', href: '/billing', icon: IndianRupee },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ],
  doctor: [
    { label: 'Consultations', href: '/doctor', icon: ClipboardList },
    { label: 'Patients', href: '/patients', icon: Users },
    { label: 'Appointments', href: '/appointments', icon: CalendarDays },
    { label: 'Reports', href: '/reports', icon: FileText },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ],
  chemist: [
    { label: 'Pharmacy', href: '/chemist', icon: Boxes },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ],
  patient: [
    { label: 'My Dashboard', href: '/patient', icon: Building2 },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ],
}

const NAV_BOTTOM: NavEntry[] = [
  { label: 'Settings', href: '/settings', icon: KeyRound },
]

export function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [searchValue, setSearchValue] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const menu = useMemo(() => (user ? (NAV[user.role] ?? []) : []), [user])

  // Notification badge count
  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => fetcher<{ notifications: Notification[] }>('/notifications'),
    refetchInterval: 30000,
    enabled: !!user
  })
  const unreadCount = (notifData?.notifications ?? []).filter((n) => !n.readAt).length

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const socket = getSocket()
    socket.on('notification:new', (payload) => {
      toast(payload.title ?? 'New notification')
      void refetchNotifs()
    })
    socket.on('medicine:ready', () => {
      toast.success('Medicines are ready for pickup')
      void refetchNotifs()
    })
    socket.on('queue:update', () => toast('Queue updated'))
    return () => {
      socket.off('notification:new')
      socket.off('medicine:ready')
      socket.off('queue:update')
    }
  }, [refetchNotifs])

  const signOut = async () => {
    await api.post('/auth/logout').catch(() => undefined)
    logout()
    navigate('/login')
  }

  // Keyboard shortcut: Cmd/Ctrl+K focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Search: navigate to patients page with the query
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/patients?search=${encodeURIComponent(searchValue.trim())}`)
      setSearchValue('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Toaster richColors position="top-right" />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-teal text-white shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate">City Care HMS</p>
            <p className="text-xs uppercase tracking-wide text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Main nav */}
        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
          {menu.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end={href !== '/notifications' && href !== '/patients' && href !== '/appointments' && href !== '/queue' && href !== '/billing' && href !== '/reports'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal/10 text-teal'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
              onClick={() => setOpen(false)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="rounded-full bg-teal text-white text-xs px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-1">
          {NAV_BOTTOM.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal/10 text-teal'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
              onClick={() => setOpen(false)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
          <button
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
          <div className="px-3 py-2">
            <p className="text-xs text-slate-400 truncate">{user?.name}</p>
            <p className="text-xs text-slate-300 dark:text-slate-600 truncate">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex items-center gap-3">
            <button
              className="btn-secondary w-10 px-0 lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative max-w-lg flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                className="field pl-9 pr-16"
                placeholder="Search patients, tokens… (⌘K)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
                ⌘K
              </kbd>
            </form>

            {/* Notification bell shortcut */}
            <NavLink
              to="/notifications"
              className="relative btn-secondary w-10 px-0 flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-coral text-white text-[10px] grid place-items-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>

            <button
              className="btn-secondary w-10 px-0"
              onClick={() => setDark((v) => !v)}
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
