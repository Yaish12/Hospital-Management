import fs from 'node:fs'
import multer from 'multer'
import { env } from '../config/env.js'

fs.mkdirSync(env.uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
})

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }
})
