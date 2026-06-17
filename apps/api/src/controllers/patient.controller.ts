import { Appointment, AuditLog, Billing, Department, Doctor, Notification, Patient, Queue, User } from '../models/index.js'
import { hashPassword } from '../utils/auth.js'
import { AppError, asyncHandler } from '../utils/http.js'
import { patientId, queueToken } from '../utils/ids.js'
import { sendMail } from '../utils/mailer.js'
import { registrationSlipPdf } from '../utils/pdf.js'
import { emitEvent } from '../socket.js'

const patientPopulate = [
  { path: 'user', select: 'name email phone role status' },
  { path: 'department', select: 'name code' }
]

export const listPatients = asyncHandler(async (req, res) => {
  const search = String(req.query.search ?? '')
  const filter = search
    ? { $or: [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }, { patientId: new RegExp(search, 'i') }] }
    : {}
  const patients = await Patient.find(filter).sort({ createdAt: -1 }).limit(100).populate(patientPopulate)
  res.json({ patients })
})

export const createPatient = asyncHandler(async (req, res) => {
  const tempPassword = req.body.password || `Patient@${Math.floor(1000 + Math.random() * 9000)}`
  const email = req.body.email || `${Date.now()}-${req.body.phone}@patient.local`
  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) throw new AppError(409, 'A user already exists with this email')

  const department = req.body.department ? await Department.findById(req.body.department) : await Department.findOne({ active: true })
  const doctor = req.body.doctor ? await Doctor.findById(req.body.doctor) : await Doctor.findOne({ department: department?._id })
  const user = await User.create({
    name: req.body.name,
    email,
    phone: req.body.phone,
    role: 'patient',
    passwordHash: await hashPassword(tempPassword)
  })

  const patient = await Patient.create({
    ...req.body,
    email,
    user: user._id,
    patientId: patientId(),
    department: department?._id,
    departmentName: department ? (department as any).name : 'General',
    qrCode: `HMS:${user._id}:${Date.now()}`
  })

  const appointment = doctor
    ? await Appointment.create({
        patient: patient._id,
        doctor: doctor._id,
        department: department?._id,
        scheduledAt: req.body.scheduledAt || new Date(),
        reason: req.body.reason || 'Walk-in consultation',
        status: 'checked-in'
      })
    : undefined

  const queueCount = await Queue.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
  const queue = await Queue.create({
    patient: patient._id,
    doctor: doctor?._id,
    appointment: appointment?._id,
    department: department?._id,
    token: queueToken(queueCount),
    position: queueCount + 1,
    estimatedWaitMinutes: (queueCount + 1) * 15
  })

  await Notification.create({
    user: user._id,
    patient: patient._id,
    type: 'queue',
    title: 'Registration complete',
    message: `Your queue token is ${queue.token}. Estimated wait time is ${queue.estimatedWaitMinutes} minutes.`
  })
  await Billing.create({
    patient: patient._id,
    appointment: appointment?._id,
    items: [{ label: 'Registration and consultation', amount: doctor ? (doctor as any).consultationFee : 500 }],
    subtotal: doctor ? (doctor as any).consultationFee : 500,
    total: doctor ? (doctor as any).consultationFee : 500
  })
  await AuditLog.create({ actor: req.user?.id, action: 'patient.create', entity: 'Patient', entityId: patient.id, ip: req.ip })
  await sendMail(email, 'Patient account created', `Login: ${email}\nTemporary password: ${tempPassword}\nQueue token: ${queue.token}`)

  emitEvent('queue:update', { queue }, 'role:doctor')
  emitEvent('notification:new', { title: 'Patient registered', patient: patient.name }, 'role:admin')
  res.status(201).json({ patient, queue, appointment, credentials: { email, password: tempPassword } })
})

export const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate(patientPopulate)
  if (!patient) throw new AppError(404, 'Patient not found')
  res.json({ patient })
})

export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(patientPopulate)
  if (!patient) throw new AppError(404, 'Patient not found')
  await AuditLog.create({ actor: req.user?.id, action: 'patient.update', entity: 'Patient', entityId: patient.id, ip: req.ip })
  res.json({ patient })
})

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.params.id)
  if (!patient) throw new AppError(404, 'Patient not found')
  await AuditLog.create({ actor: req.user?.id, action: 'patient.delete', entity: 'Patient', entityId: patient.id, ip: req.ip })
  res.json({ message: 'Patient deleted' })
})

export const registrationSlip = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
  if (!patient) throw new AppError(404, 'Patient not found')
  const queue = await Queue.findOne({ patient: patient._id }).sort({ createdAt: -1 })
  const buffer = await registrationSlipPdf(patient, queue?.token)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${patient.patientId}-registration.pdf"`)
  res.send(buffer)
})
