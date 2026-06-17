import { Router } from 'express'
import { authorize } from '../middleware/auth.js'
import { createAppointment, listAppointments, updateAppointmentStatus } from '../controllers/appointment.controller.js'

export const appointmentRoutes = Router()

appointmentRoutes.get('/', authorize('admin', 'receptionist', 'doctor', 'patient'), listAppointments)
appointmentRoutes.post('/', authorize('admin', 'receptionist'), createAppointment)
appointmentRoutes.put('/status', authorize('admin', 'receptionist', 'doctor'), updateAppointmentStatus)
