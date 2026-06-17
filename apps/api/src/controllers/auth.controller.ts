import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { User } from '../models/index.js'
import { createTokenPair, hashPassword, verifyPassword, verifyRefreshToken } from '../utils/auth.js'
import { AppError, asyncHandler } from '../utils/http.js'
import { sendMail } from '../utils/mailer.js'

const publicUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email: String(email).toLowerCase() })
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw new AppError(401, 'Invalid email or password')
  if (user.status !== 'active') throw new AppError(403, 'Account is inactive')

  const payload = { sub: user.id, role: user.role, email: user.email, name: user.name }
  const tokens = createTokenPair(payload)
  user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12)
  user.lastLoginAt = new Date()
  await user.save()

  res.json({ user: publicUser(user), ...tokens })
})

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) throw new AppError(400, 'Refresh token is required')
  const payload = verifyRefreshToken(refreshToken)
  const user = await User.findById(payload.sub)
  if (!user?.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) {
    throw new AppError(401, 'Invalid refresh token')
  }
  const tokens = createTokenPair({ sub: user.id, role: user.role, email: user.email, name: user.name })
  user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12)
  await user.save()
  res.json(tokens)
})

export const logout = asyncHandler(async (req, res) => {
  if (req.user?.id) await User.findByIdAndUpdate(req.user.id, { $unset: { refreshTokenHash: 1 } })
  res.json({ message: 'Logged out' })
})

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?.id)
  res.json({ user: publicUser(user) })
})

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user?.id)
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError(400, 'Current password is incorrect')
  }
  user.passwordHash = await hashPassword(newPassword)
  user.refreshTokenHash = undefined
  await user.save()
  res.json({ message: 'Password changed' })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email).toLowerCase() })
  if (user) {
    const token = crypto.randomBytes(32).toString('hex')
    user.resetTokenHash = await bcrypt.hash(token, 12)
    user.resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 20)
    await user.save()
    await sendMail(user.email, 'Password reset', `Use this reset token: ${token}`)
  }
  res.json({ message: 'If the account exists, a reset token was sent' })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body
  const user = await User.findOne({ email: String(email).toLowerCase(), resetTokenExpiresAt: { $gt: new Date() } })
  if (!user?.resetTokenHash || !(await bcrypt.compare(token, user.resetTokenHash))) throw new AppError(400, 'Invalid reset token')
  user.passwordHash = await hashPassword(newPassword)
  user.resetTokenHash = undefined
  user.resetTokenExpiresAt = undefined
  user.refreshTokenHash = undefined
  await user.save()
  res.json({ message: 'Password reset complete' })
})
