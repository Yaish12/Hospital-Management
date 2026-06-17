import http from 'node:http'
import { connectDb } from './config/db.js'
import { env } from './config/env.js'
import { createApp } from './app.js'
import { initSocket } from './socket.js'

const start = async () => {
  await connectDb()
  const app = createApp()
  const server = http.createServer(app)
  initSocket(server)
  server.listen(env.port, () => {
    console.info(`Hospital API running on http://localhost:${env.port}`)
  })
}

start().catch((error) => {
  console.error(error)
  process.exit(1)
})
