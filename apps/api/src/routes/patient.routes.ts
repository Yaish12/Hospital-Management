import { Router } from 'express'
import { authorize } from '../middleware/auth.js'
import { createPatient, deletePatient, getPatient, listPatients, registrationSlip, updatePatient } from '../controllers/patient.controller.js'

export const patientRoutes = Router()

patientRoutes.get('/', authorize('admin', 'receptionist', 'doctor'), listPatients)
patientRoutes.post('/', authorize('admin', 'receptionist'), createPatient)
patientRoutes.get('/:id/slip', authorize('admin', 'receptionist', 'patient'), registrationSlip)
patientRoutes.get('/:id', authorize('admin', 'receptionist', 'doctor', 'patient'), getPatient)
patientRoutes.put('/:id', authorize('admin', 'receptionist'), updatePatient)
patientRoutes.delete('/:id', authorize('admin'), deletePatient)
