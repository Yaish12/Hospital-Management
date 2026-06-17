export const ROLES = ['admin', 'receptionist', 'doctor', 'chemist', 'patient'] as const
export type Role = (typeof ROLES)[number]

export const QUEUE_STATUS = ['waiting', 'called', 'in-consultation', 'completed', 'cancelled'] as const
export type QueueStatus = (typeof QUEUE_STATUS)[number]

export const PRESCRIPTION_STATUS = ['sent-to-chemist', 'packing', 'ready', 'collected'] as const
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUS)[number]

export const APPOINTMENT_STATUS = ['scheduled', 'checked-in', 'completed', 'cancelled'] as const
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number]

export const BILLING_STATUS = ['unpaid', 'paid', 'refunded'] as const
export type BillingStatus = (typeof BILLING_STATUS)[number]

export type PatientVitals = {
  temperature?: number
  bloodPressure?: string
  pulse?: number
  weight?: number
  height?: number
}

export type MedicineLine = {
  medicine: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  quantity: number
}
