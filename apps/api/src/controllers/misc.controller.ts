import { Appointment, AuditLog, Billing, Chemist, Department, Doctor, Inventory, Medicine, Notification, Patient, Prescription, Queue, Receptionist, Report, User } from '../models/index.js'
import { AppError, asyncHandler } from '../utils/http.js'

export const billingList = asyncHandler(async (req, res) => {
  let filter: Record<string, unknown> = {}
  if (req.user?.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user.id })
    filter = patient ? { patient: patient._id } : { patient: null }
  }
  const bills = await Billing.find(filter).sort({ createdAt: -1 }).populate('patient appointment')
  res.json({ bills })
})

export const createBill = asyncHandler(async (req, res) => {
  const subtotal = (req.body.items ?? []).reduce((sum: number, item: any) => sum + Number(item.amount ?? 0), 0)
  const discount = Number(req.body.discount ?? 0)
  const tax = Number(req.body.tax ?? 0)
  const bill = await Billing.create({ ...req.body, subtotal, total: subtotal - discount + tax })
  res.status(201).json({ bill })
})

export const updateBillStatus = asyncHandler(async (req, res) => {
  const { billId, status } = req.body
  const patch: Record<string, unknown> = { status }
  if (status === 'paid') patch.paidAt = new Date()
  const bill = await Billing.findByIdAndUpdate(billId, patch, { new: true }).populate('patient appointment')
  if (!bill) throw new AppError(404, 'Bill not found')
  res.json({ bill })
})

export const notifications = asyncHandler(async (req, res) => {
  const filter = req.user?.role === 'admin' ? {} : { user: req.user?.id }
  const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(50)
  res.json({ notifications: items })
})

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.body
  const filter = notificationId ? { _id: notificationId } : { user: req.user?.id, readAt: { $exists: false } }
  await Notification.updateMany(filter, { readAt: new Date() })
  res.json({ message: 'Marked as read' })
})

export const createNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.create(req.body)
  res.status(201).json({ notification })
})

export const reports = asyncHandler(async (_req, res) => {
  const items = await Report.find().sort({ createdAt: -1 }).populate('patient uploadedBy')
  res.json({ reports: items })
})

export const uploadReport = asyncHandler(async (req, res) => {
  const file = req.file
  const report = await Report.create({
    patient: req.body.patient,
    uploadedBy: req.user?.id,
    title: req.body.title,
    type: req.body.type,
    notes: req.body.notes,
    fileUrl: file ? `/uploads/${file.filename}` : req.body.fileUrl
  })
  res.status(201).json({ report })
})

export const adminAnalytics = asyncHandler(async (_req, res) => {
  const [patients, doctors, waiting, prescriptions, revenue, lowStock] = await Promise.all([
    Patient.countDocuments(),
    Doctor.countDocuments(),
    Queue.countDocuments({ status: { $in: ['waiting', 'called', 'in-consultation'] } }),
    Prescription.countDocuments({ status: { $in: ['sent-to-chemist', 'packing', 'ready'] } }),
    Billing.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Inventory.find().populate('medicine').then((items) => items.filter((item: any) => item.quantity <= item.reorderLevel).length)
  ])
  res.json({ patients, doctors, waiting, prescriptions, revenue: revenue[0]?.total ?? 0, lowStock })
})

export const users = asyncHandler(async (_req, res) => {
  const users = await User.find().select('-passwordHash -refreshTokenHash -resetTokenHash').sort({ createdAt: -1 })
  res.json({ users })
})

export const createUser = asyncHandler(async (req, res) => {
  const { hashPassword } = await import('../utils/auth.js')
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    role: req.body.role,
    passwordHash: await hashPassword(req.body.password ?? 'Password@123')
  })

  if (user.role === 'doctor') {
    await Doctor.create({
      user: user._id,
      employeeId: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      specialization: req.body.specialization || 'General Practice',
      department: req.body.department || null,
      room: req.body.room || '101',
      consultationFee: Number(req.body.consultationFee ?? 500)
    })
  } else if (user.role === 'receptionist') {
    await Receptionist.create({
      user: user._id,
      employeeId: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      shift: 'Morning',
      counter: 'A1'
    })
  } else if (user.role === 'chemist') {
    await Chemist.create({
      user: user._id,
      employeeId: `CHM-${Math.floor(1000 + Math.random() * 9000)}`,
      shift: 'Morning',
      counter: 'P1'
    })
  }

  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

export const updateUser = asyncHandler(async (req, res) => {
  const { hashPassword } = await import('../utils/auth.js')
  const patch: Record<string, unknown> = {}
  if (req.body.name) patch.name = req.body.name
  if (req.body.phone !== undefined) patch.phone = req.body.phone
  if (req.body.status) patch.status = req.body.status
  if (req.body.password) patch.passwordHash = await hashPassword(req.body.password)

  const user = await User.findByIdAndUpdate(req.params.id, patch, { new: true }).select('-passwordHash -refreshTokenHash -resetTokenHash')
  if (!user) throw new AppError(404, 'User not found')

  // Update linked doctor profile if doctor fields are sent
  if (user.role === 'doctor') {
    const docPatch: Record<string, unknown> = {}
    if (req.body.specialization) docPatch.specialization = req.body.specialization
    if (req.body.department) docPatch.department = req.body.department
    if (req.body.room) docPatch.room = req.body.room
    if (req.body.consultationFee) docPatch.consultationFee = Number(req.body.consultationFee)
    if (Object.keys(docPatch).length) await Doctor.findOneAndUpdate({ user: user._id }, docPatch)
  }

  await AuditLog.create({ actor: req.user?.id, action: 'user.update', entity: 'User', entityId: user.id, ip: req.ip })
  res.json({ user })
})

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id)
  if (!user) throw new AppError(404, 'User not found')
  // Remove linked staff profiles
  if (user.role === 'doctor') await Doctor.findOneAndDelete({ user: user._id })
  if (user.role === 'receptionist') await Receptionist.findOneAndDelete({ user: user._id })
  if (user.role === 'chemist') await Chemist.findOneAndDelete({ user: user._id })
  await AuditLog.create({ actor: req.user?.id, action: 'user.delete', entity: 'User', entityId: user.id, ip: req.ip })
  res.json({ message: 'User deleted' })
})

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!department) throw new AppError(404, 'Department not found')
  await AuditLog.create({ actor: req.user?.id, action: 'department.update', entity: 'Department', entityId: String(department._id), ip: req.ip })
  res.json({ department })
})

export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id)
  if (!department) throw new AppError(404, 'Department not found')
  await AuditLog.create({ actor: req.user?.id, action: 'department.delete', entity: 'Department', entityId: String(department._id), ip: req.ip })
  res.json({ message: 'Department deleted' })
})
  const departments = await Department.find().sort({ name: 1 })
  res.json({ departments })
})

export const doctors = asyncHandler(async (_req, res) => {
  const doctors = await Doctor.find().sort({ createdAt: -1 }).populate('user', 'name email phone').populate('department', 'name code')
  res.json({ doctors })
})

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body)
  res.status(201).json({ department })
})

export const medicines = asyncHandler(async (_req, res) => {
  const medicines = await Medicine.find().sort({ name: 1 })
  res.json({ medicines })
})

export const inventory = asyncHandler(async (_req, res) => {
  const inventory = await Inventory.find().sort({ updatedAt: -1 }).populate('medicine')
  res.json({ inventory })
})

export const auditLogs = asyncHandler(async (_req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).populate('actor', 'name email role')
  res.json({ logs })
})

export const patientHome = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user?.id })
  const queue = patient ? await Queue.findOne({ patient: patient._id }).sort({ createdAt: -1 }).populate('doctor department') : undefined
  const prescriptions = patient ? await Prescription.find({ patient: patient._id }).sort({ createdAt: -1 }).populate('doctor medicines.medicine') : []
  const bills = patient ? await Billing.find({ patient: patient._id }).sort({ createdAt: -1 }) : []
  const reports = patient ? await Report.find({ patient: patient._id }).sort({ createdAt: -1 }) : []
  const appointments = patient ? await Appointment.find({ patient: patient._id }).sort({ scheduledAt: -1 }).populate('doctor department') : []
  res.json({ patient, queue, prescriptions, bills, reports, appointments })
})
