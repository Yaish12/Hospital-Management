import { Router } from 'express'
import { authorize } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import {
  adminAnalytics,
  auditLogs,
  billingList,
  createBill,
  updateBillStatus,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createNotification,
  markNotificationRead,
  createUser,
  updateUser,
  deleteUser,
  departments,
  doctors,
  inventory,
  addInventory,
  updateInventoryQty,
  createMedicine,
  medicines,
  notifications,
  patientHome,
  reports,
  uploadReport,
  users
} from '../controllers/misc.controller.js'

export const billingRoutes = Router()
billingRoutes.get('/', authorize('admin', 'receptionist', 'patient'), billingList)
billingRoutes.post('/', authorize('admin', 'receptionist'), createBill)
billingRoutes.put('/status', authorize('admin', 'receptionist'), updateBillStatus)

export const notificationRoutes = Router()
notificationRoutes.get('/', authorize('admin', 'receptionist', 'doctor', 'chemist', 'patient'), notifications)
notificationRoutes.post('/', authorize('admin', 'receptionist', 'doctor', 'chemist'), createNotification)
notificationRoutes.put('/read', authorize('admin', 'receptionist', 'doctor', 'chemist', 'patient'), markNotificationRead)

export const reportRoutes = Router()
reportRoutes.get('/', authorize('admin', 'doctor', 'patient'), reports)
reportRoutes.post('/upload', authorize('admin', 'doctor'), upload.single('file'), uploadReport)

export const adminRoutes = Router()
adminRoutes.get('/analytics', authorize('admin'), adminAnalytics)
adminRoutes.get('/users', authorize('admin'), users)
adminRoutes.post('/users', authorize('admin'), createUser)
adminRoutes.put('/users/:id', authorize('admin'), updateUser)
adminRoutes.delete('/users/:id', authorize('admin'), deleteUser)
adminRoutes.get('/departments', authorize('admin', 'receptionist', 'doctor'), departments)
adminRoutes.post('/departments', authorize('admin'), createDepartment)
adminRoutes.put('/departments/:id', authorize('admin'), updateDepartment)
adminRoutes.delete('/departments/:id', authorize('admin'), deleteDepartment)
adminRoutes.get('/doctors', authorize('admin', 'receptionist', 'doctor'), doctors)
adminRoutes.get('/medicines', authorize('admin', 'doctor', 'chemist'), medicines)
adminRoutes.post('/medicines', authorize('admin', 'chemist'), createMedicine)
adminRoutes.get('/inventory', authorize('admin', 'chemist'), inventory)
adminRoutes.post('/inventory', authorize('admin', 'chemist'), addInventory)
adminRoutes.put('/inventory/qty', authorize('admin', 'chemist'), updateInventoryQty)
adminRoutes.get('/audit-logs', authorize('admin'), auditLogs)

export const patientPortalRoutes = Router()
patientPortalRoutes.get('/home', authorize('patient'), patientHome)
