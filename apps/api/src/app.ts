import path from 'node:path'
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { authenticate } from './middleware/auth.js'
import { errorHandler, notFound } from './middleware/error.js'
import { adminRoutes, billingRoutes, notificationRoutes, patientPortalRoutes, reportRoutes } from './routes/misc.routes.js'
import { appointmentRoutes } from './routes/appointment.routes.js'
import { authRoutes } from './routes/auth.routes.js'
import { chemistRoutes } from './routes/chemist.routes.js'
import { doctorRoutes } from './routes/doctor.routes.js'
import { patientRoutes } from './routes/patient.routes.js'
import { queueRoutes } from './routes/queue.routes.js'

export const createApp = () => {
  const app = express()

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors({ origin: env.clientOrigins, credentials: true }))
  app.use(compression())
  app.use(rateLimit({ windowMs: 60_000, limit: 300 }))
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan('dev'))
  app.use('/uploads', express.static(path.resolve(env.uploadDir)))

  app.get('/api/health', (_req, res) => {
    const dbConnected = mongoose.connection.readyState === 1
    res.json({ ok: true, service: 'hospital-api', database: dbConnected ? 'connected' : 'disconnected' })
  })
  app.use('/api/auth', authRoutes)

  app.use('/api/patients', authenticate, patientRoutes)
  app.use('/api/appointments', authenticate, appointmentRoutes)
  app.use('/api/queue', authenticate, queueRoutes)
  app.use('/api/doctor', authenticate, doctorRoutes)
  app.use('/api/chemist', authenticate, chemistRoutes)
  app.use('/api/billing', authenticate, billingRoutes)
  app.use('/api/notifications', authenticate, notificationRoutes)
  app.use('/api/reports', authenticate, reportRoutes)
  app.use('/api/admin', authenticate, adminRoutes)
  app.use('/api/patient', authenticate, patientPortalRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
