import { Router } from 'express'
import { authorize } from '../middleware/auth.js'
import { addDiagnosis, createPrescription, doctorPatients } from '../controllers/doctor.controller.js'

export const doctorRoutes = Router()

doctorRoutes.get('/patients', authorize('doctor', 'admin'), doctorPatients)
doctorRoutes.post('/diagnosis', authorize('doctor'), addDiagnosis)
doctorRoutes.post('/prescription', authorize('doctor'), createPrescription)
