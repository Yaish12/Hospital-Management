import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { changePassword, forgotPassword, login, logout, me, refresh, resetPassword } from '../controllers/auth.controller.js'

export const authRoutes = Router()

authRoutes.post('/login', login)
authRoutes.post('/refresh', refresh)
authRoutes.post('/forgot-password', forgotPassword)
authRoutes.post('/reset-password', resetPassword)
authRoutes.post('/logout', authenticate, logout)
authRoutes.get('/me', authenticate, me)
authRoutes.post('/change-password', authenticate, changePassword)
