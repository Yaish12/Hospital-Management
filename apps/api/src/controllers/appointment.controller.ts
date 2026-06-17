import { Appointment, Queue } from '../models/index.js'
import { asyncHandler } from '../utils/http.js'
import { AppError } from '../utils/http.js'
import { queueToken } from '../utils/ids.js'
import { emitEvent } from '../socket.js'

export const listAppointments = asyncHandler(async (req, res) => {
  const { patientId, doctorId, status, date } = req.query
  const filter: Record<string, unknown> = {}
  if (patientId) filter.patient = patientId
  if (doctorId) filter.doctor = doctorId
  if (status) filter.status = status
  if (date) {
    const d = new Date(String(date))
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    filter.scheduledAt = { $gte: d, $lt: next }
  }
  const appointments = await Appointment.find(filter).sort({ scheduledAt: -1 }).populate('patient doctor department')
  res.json({ appointments })
})

export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.create(req.body)
  const queueCount = await Queue.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
  const queue = await Queue.create({
    patient: appointment.patient,
    doctor: appointment.doctor,
    appointment: appointment._id,
    department: appointment.department,
    token: queueToken(queueCount),
    position: queueCount + 1,
    estimatedWaitMinutes: (queueCount + 1) * 15
  })
  emitEvent('queue:update', { queue })
  res.status(201).json({ appointment, queue })
})

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { appointmentId, status, notes } = req.body
  const patch: Record<string, unknown> = { status }
  if (notes) patch.notes = notes
  const appointment = await Appointment.findByIdAndUpdate(appointmentId, patch, { new: true }).populate('patient doctor department')
  if (!appointment) throw new AppError(404, 'Appointment not found')
  res.json({ appointment })
})
