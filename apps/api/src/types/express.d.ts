import type { Role } from '../utils/auth.js'

declare global {
  namespace Express {
    interface User {
      id: string
      role: Role
      email: string
      name: string
    }

    interface Request {
      user?: User
    }
  }
}

export {}
