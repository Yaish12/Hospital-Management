import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

export const sendMail = async (to: string, subject: string, text: string) => {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    console.info(`[mail skipped] ${to} | ${subject} | ${text}`)
    return
  }

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    auth: { user: env.smtp.user, pass: env.smtp.pass }
  })

  await transporter.sendMail({ from: env.smtp.from, to, subject, text })
}
