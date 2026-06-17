import { Router } from 'express'
import { authorize } from '../middleware/auth.js'
import { chemistOrders, updateChemistStatus } from '../controllers/chemist.controller.js'

export const chemistRoutes = Router()

chemistRoutes.get('/orders', authorize('chemist', 'admin'), chemistOrders)
chemistRoutes.put('/status', authorize('chemist', 'admin'), updateChemistStatus)
