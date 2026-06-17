import type { ErrorRequestHandler } from 'express'
import { AppError } from '../utils/http.js'

export const notFound: ErrorRequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500
  res.status(statusCode).json({
    message: err.message ?? 'Something went wrong',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  })
}
