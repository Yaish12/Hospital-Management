import type { NextFunction, Request, Response } from 'express'
import { User } from '../models/index.js'
import { AppError } from '../utils/http.js'
import { verifyAccessToken, type Role } from '../utils/auth.js'

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next(new AppError(401, 'Authentication required'))

  const token = header.slice('Bearer '.length)
  const payload = verifyAccessToken(token)
  const user = await User.findById(payload.sub).select('_id role email name status')
  if (!user || user.status !== 'active') return next(new AppError(401, 'Invalid session'))

  req.user = { id: user.id, role: user.role, email: user.email, name: user.name }
  next()
}

export const authorize =
  (...allowed: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, 'Authentication required'))
    if (!allowed.includes(req.user.role)) return next(new AppError(403, 'You do not have access to this resource'))
    next()
  }
