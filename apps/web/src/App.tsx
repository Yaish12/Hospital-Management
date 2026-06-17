import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './lib/i18n'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminDashboard } from './pages/AdminDashboard'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { BillingPage } from './pages/BillingPage'
import { ChangePassword } from './pages/ChangePassword'
import { ChemistDashboard } from './pages/ChemistDashboard'
import { DoctorDashboard } from './pages/DoctorDashboard'
import { ForgotPassword } from './pages/ForgotPassword'
import { Login } from './pages/Login'
import { NotificationsPage } from './pages/NotificationsPage'
import { PatientDashboard } from './pages/PatientDashboard'
import { PatientsPage } from './pages/PatientsPage'
import { QueuePage } from './pages/QueuePage'
import { ReceptionistDashboard } from './pages/ReceptionistDashboard'
import { ReportsPage } from './pages/ReportsPage'
import { ResetPassword } from './pages/ResetPassword'
import { useAuthStore } from './stores/auth-store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000
    }
  }
})

export default function App() {
  const { hydrate, hydrated, user } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hydrated) return null

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes — require auth */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Root redirect based on role */}
            <Route
              path="/"
              element={<Navigate to={user ? `/${user.role}` : '/login'} replace />}
            />

            {/* Role dashboards */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route element={<ProtectedRoute roles={['receptionist']} />}>
              <Route path="/receptionist" element={<ReceptionistDashboard />} />
            </Route>

            <Route element={<ProtectedRoute roles={['doctor']} />}>
              <Route path="/doctor" element={<DoctorDashboard />} />
            </Route>

            <Route element={<ProtectedRoute roles={['chemist']} />}>
              <Route path="/chemist" element={<ChemistDashboard />} />
            </Route>

            <Route element={<ProtectedRoute roles={['patient']} />}>
              <Route path="/patient" element={<PatientDashboard />} />
            </Route>

            {/* Shared pages — role-gated per page's own rules */}
            <Route element={<ProtectedRoute roles={['admin', 'receptionist', 'doctor']} />}>
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/queue" element={<QueuePage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin', 'receptionist']} />}>
              <Route path="/billing" element={<BillingPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin', 'doctor']} />}>
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            {/* All authenticated users */}
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<ChangePassword />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </QueryClientProvider>
  )
}
