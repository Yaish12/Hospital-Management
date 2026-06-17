import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { env } from './config/env.js'

let io: Server | undefined

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: { origin: env.clientOrigins, credentials: true }
  })

  io.on('connection', (socket) => {
    socket.on('join:user', (userId: string) => socket.join(`user:${userId}`))
    socket.on('join:role', (role: string) => socket.join(`role:${role}`))
    socket.on('join:patient', (patientId: string) => socket.join(`patient:${patientId}`))
    socket.on('join:doctor', (doctorId: string) => socket.join(`doctor:${doctorId}`))
  })

  return io
}

export const emitEvent = (event: string, payload: unknown, room?: string) => {
  if (!io) return
  if (room) io.to(room).emit(event, payload)
  else io.emit(event, payload)
}
