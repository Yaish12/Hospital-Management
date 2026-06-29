import mongoose, { Schema, type Model } from 'mongoose'
import type { Role } from '../utils/auth.js'

const objectId = Schema.Types.ObjectId
const schema = (definition: Record<string, unknown>, options?: Record<string, unknown>) => new Schema<any>(definition, options)

const userSchema = schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'receptionist', 'doctor', 'chemist', 'patient'], required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    refreshTokenHash: String,
    resetTokenHash: String,
    resetTokenExpiresAt: Date,
    lastLoginAt: Date
  },
  { timestamps: true }
)

const departmentSchema = schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    description: String,
    floor: String,
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
)

const patientSchema = schema(
  {
    user: { type: objectId, ref: 'User' },
    patientId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true },
    age: Number,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: String,
    address: String,
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    },
    allergies: [String],
    medicalHistory: [String],
    department: { type: objectId, ref: 'Department' },
    departmentName: String,
    preferredLanguage: { type: String, default: 'en' },
    qrCode: String
  },
  { timestamps: true }
)

const doctorSchema = schema(
  {
    user: { type: objectId, ref: 'User', required: true },
    employeeId: { type: String, required: true, unique: true },
    specialization: { type: String, required: true },
    department: { type: objectId, ref: 'Department' },
    room: String,
    availability: [{ day: String, start: String, end: String }],
    consultationFee: { type: Number, default: 500 }
  },
  { timestamps: true }
)

const staffSchema = schema(
  {
    user: { type: objectId, ref: 'User', required: true },
    employeeId: { type: String, required: true, unique: true },
    shift: String,
    counter: String
  },
  { timestamps: true }
)

const appointmentSchema = schema(
  {
    patient: { type: objectId, ref: 'Patient', required: true },
    doctor: { type: objectId, ref: 'Doctor', required: true },
    department: { type: objectId, ref: 'Department' },
    scheduledAt: { type: Date, required: true },
    reason: String,
    status: { type: String, enum: ['scheduled', 'checked-in', 'completed', 'cancelled'], default: 'scheduled' },
    notes: String
  },
  { timestamps: true }
)

const vitalsSchema = schema(
  {
    temperature: Number,
    bloodPressure: String,
    pulse: Number,
    weight: Number,
    height: Number
  },
  { _id: false }
)

const queueSchema = schema(
  {
    token: { type: String, required: true },
    patient: { type: objectId, ref: 'Patient', required: true },
    doctor: { type: objectId, ref: 'Doctor' },
    appointment: { type: objectId, ref: 'Appointment' },
    department: { type: objectId, ref: 'Department' },
    status: { type: String, enum: ['waiting', 'called', 'in-consultation', 'completed', 'cancelled'], default: 'waiting' },
    position: { type: Number, required: true },
    estimatedWaitMinutes: { type: Number, default: 15 },
    checkedInAt: { type: Date, default: Date.now },
    calledAt: Date,
    completedAt: Date
  },
  { timestamps: true }
)

const prescriptionItemSchema = schema(
  {
    medicine: { type: objectId, ref: 'Medicine' },
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: String,
    quantity: { type: Number, default: 1 }
  },
  { _id: false }
)

const prescriptionSchema = schema(
  {
    patient: { type: objectId, ref: 'Patient', required: true },
    doctor: { type: objectId, ref: 'Doctor', required: true },
    diagnosis: { type: String, required: true },
    instructions: String,
    doList: [String],
    dontList: [String],
    followUpAt: Date,
    vitals: vitalsSchema,
    medicines: [prescriptionItemSchema],
    status: { type: String, enum: ['sent-to-chemist', 'packing', 'ready', 'collected'], default: 'sent-to-chemist' },
    sentToChemistAt: Date,
    readyAt: Date,
    collectedAt: Date
  },
  { timestamps: true }
)

const medicineSchema = schema(
  {
    name: { type: String, required: true, unique: true },
    genericName: String,
    manufacturer: String,
    category: String,
    unit: { type: String, default: 'tablet' },
    price: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
)

const inventorySchema = schema(
  {
    medicine: { type: objectId, ref: 'Medicine', required: true },
    batchNo: { type: String, required: true },
    quantity: { type: Number, required: true },
    reorderLevel: { type: Number, default: 20 },
    expiryDate: Date,
    location: String
  },
  { timestamps: true }
)

const notificationSchema = schema(
  {
    user: { type: objectId, ref: 'User' },
    patient: { type: objectId, ref: 'Patient' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['queue', 'medicine', 'billing', 'system'], default: 'system' },
    readAt: Date,
    metadata: Schema.Types.Mixed
  },
  { timestamps: true }
)

const billingItemSchema = schema(
  {
    label: { type: String, required: true },
    amount: { type: Number, required: true }
  },
  { _id: false }
)

const billingSchema = schema(
  {
    patient: { type: objectId, ref: 'Patient', required: true },
    appointment: { type: objectId, ref: 'Appointment' },
    items: [billingItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'insurance', 'other'] },
    paymentReference: String,
    paidAt: Date
  },
  { timestamps: true }
)

const reportSchema = schema(
  {
    patient: { type: objectId, ref: 'Patient', required: true },
    uploadedBy: { type: objectId, ref: 'User', required: true },
    title: { type: String, required: true },
    type: { type: String, default: 'clinical' },
    fileUrl: { type: String, required: true },
    notes: String
  },
  { timestamps: true }
)

const auditLogSchema = schema(
  {
    actor: { type: objectId, ref: 'User' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: String,
    ip: String,
    metadata: Schema.Types.Mixed
  },
  { timestamps: true }
)

const settingSchema = schema(
  {
    name: { type: String, default: 'City Care Hospital' },
    address: String,
    phone: String,
    email: String,
    timezone: { type: String, default: 'Asia/Kolkata' },
    languages: { type: [String], default: ['en', 'hi'] },
    queueAverageMinutes: { type: Number, default: 15 }
  },
  { timestamps: true }
)

export type UserDocument = mongoose.Document & {
  name: string
  email: string
  phone?: string
  passwordHash: string
  role: Role
  status: 'active' | 'inactive'
  refreshTokenHash?: string
  resetTokenHash?: string
  resetTokenExpiresAt?: Date
  lastLoginAt?: Date
}

export type PatientDocument = mongoose.Document & {
  user?: mongoose.Types.ObjectId
  patientId: string
  name: string
  email?: string
  phone: string
  departmentName?: string
}

const model = <T>(name: string, schema: Schema): Model<T> =>
  (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema)

export const User = model<UserDocument>('User', userSchema)
export const Department = model('Department', departmentSchema)
export const Patient = model<PatientDocument>('Patient', patientSchema)
export const Doctor = model('Doctor', doctorSchema)
export const Receptionist = model('Receptionist', staffSchema)
export const Chemist = model('Chemist', staffSchema)
export const Appointment = model('Appointment', appointmentSchema)
export const Queue = model('Queue', queueSchema)
export const Prescription = model('Prescription', prescriptionSchema)
export const Medicine = model('Medicine', medicineSchema)
export const Inventory = model('Inventory', inventorySchema)
export const Notification = model('Notification', notificationSchema)
export const Billing = model('Billing', billingSchema)
export const Report = model('Report', reportSchema)
export const AuditLog = model('AuditLog', auditLogSchema)
export const HospitalSetting = model('HospitalSetting', settingSchema)
