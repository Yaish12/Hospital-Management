import { Router } from 'express'
import { authorize } from '../middleware/auth.js'
import { listQueue, updateQueueStatus } from '../controllers/queue.controller.js'

export const queueRoutes = Router()

queueRoutes.get('/', authorize('admin', 'receptionist', 'doctor', 'patient'), listQueue)
queueRoutes.put('/status', authorize('admin', 'receptionist', 'doctor'), updateQueueStatus)
