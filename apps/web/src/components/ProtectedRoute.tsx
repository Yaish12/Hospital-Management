import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '../lib/types'
import { useAuthStore } from '../stores/auth-store'

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />
  return <Outlet />
}
