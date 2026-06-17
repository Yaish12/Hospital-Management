export type Role = 'admin' | 'receptionist' | 'doctor' | 'chemist' | 'patient'

export type User = {
  id: string
  name: string
  email: string
  phone?: string
  role: Role
  status: 'active' | 'inactive'
}

export type Patient = {
  _id: string
  patientId: string
  name: string
  email?: string
  phone: string
  age?: number
  gender?: string
  bloodGroup?: string
  address?: string
  allergies?: string[]
  medicalHistory?: string[]
  departmentName?: string
  user?: string | User
  createdAt?: string
}

export type Department = {
  _id: string
  name: string
  code: string
  description?: string
  floor?: string
  active: boolean
}

export type Doctor = {
  _id: string
  user?: { _id: string; name: string; email: string; phone?: string }
  employeeId: string
  specialization: string
  department?: Department
  room?: string
  consultationFee: number
}

export type QueueItem = {
  _id: string
  token: string
  patient: Patient
  doctor?: Doctor | null
  department?: Department | null
  appointment?: string
  status: 'waiting' | 'called' | 'in-consultation' | 'completed' | 'cancelled'
  position: number
  estimatedWaitMinutes: number
  checkedInAt?: string
  calledAt?: string
  completedAt?: string
}

export type Medicine = {
  _id: string
  name: string
  genericName?: string
  manufacturer?: string
  category?: string
  unit: string
  price: number
  active: boolean
}

export type InventoryItem = {
  _id: string
  medicine: Medicine
  batchNo: string
  quantity: number
  reorderLevel: number
  expiryDate?: string
  location?: string
  updatedAt?: string
}

export type PrescriptionMedicine = {
  medicine?: Medicine | string
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  quantity: number
}

export type Prescription = {
  _id: string
  patient: Patient
  doctor?: Doctor
  diagnosis: string
  instructions?: string
  doList?: string[]
  dontList?: string[]
  followUpAt?: string
  vitals?: {
    temperature?: number
    bloodPressure?: string
    pulse?: number
    weight?: number
    height?: number
  }
  status: 'sent-to-chemist' | 'packing' | 'ready' | 'collected'
  medicines: PrescriptionMedicine[]
  sentToChemistAt?: string
  readyAt?: string
  collectedAt?: string
  createdAt: string
}

export type BillingItem = {
  label: string
  amount: number
}

export type Bill = {
  _id: string
  patient: Patient | string
  appointment?: string
  items: BillingItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  status: 'unpaid' | 'paid' | 'refunded'
  paidAt?: string
  createdAt: string
}

export type Report = {
  _id: string
  patient: Patient | string
  uploadedBy?: { name: string; email: string }
  title: string
  type: string
  fileUrl: string
  notes?: string
  createdAt: string
}

export type Appointment = {
  _id: string
  patient: Patient | string
  doctor?: Doctor | null
  department?: Department | null
  scheduledAt: string
  reason?: string
  status: 'scheduled' | 'checked-in' | 'completed' | 'cancelled'
  notes?: string
  createdAt: string
}

export type Notification = {
  _id: string
  user?: string
  patient?: Patient | string
  title: string
  message: string
  type: 'queue' | 'medicine' | 'billing' | 'system'
  readAt?: string
  createdAt: string
}
