import dotenv from 'dotenv'

dotenv.config()

const required = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/hospital_management'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'change-me-access-secret'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'change-me-refresh-secret'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((origin) => origin.trim()),
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? 'Hospital HMS <no-reply@hospital.local>'
  }
}
