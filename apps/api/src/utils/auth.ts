import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const roles = ['admin', 'receptionist', 'doctor', 'chemist', 'patient'] as const
export type Role = (typeof roles)[number]

type TokenPayload = {
  sub: string
  role: Role
  email: string
  name: string
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12)
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash)

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpiresIn })

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn })

export const verifyAccessToken = (token: string) => jwt.verify(token, env.jwtAccessSecret) as TokenPayload
export const verifyRefreshToken = (token: string) => jwt.verify(token, env.jwtRefreshSecret) as TokenPayload

export const createTokenPair = (payload: TokenPayload) => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken(payload)
})

export const isRole = (value: unknown): value is Role => typeof value === 'string' && roles.includes(value as Role)
