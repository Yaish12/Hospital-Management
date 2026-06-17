import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '../stores/auth-store'

let socket: Socket | undefined

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL ?? window.location.origin, {
      transports: ['websocket']
    })
    const user = useAuthStore.getState().user
    if (user) {
      socket.emit('join:user', user.id)
      socket.emit('join:role', user.role)
    }
  }
  return socket
}
