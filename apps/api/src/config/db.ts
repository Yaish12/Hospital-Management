import mongoose from 'mongoose'
import { env } from './env.js'

export const connectDb = async () => {
  mongoose.set('strictQuery', true)
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 })
    console.info(`MongoDB connected: ${env.mongoUri}`)
  } catch (error: any) {
    const message = error?.message ?? String(error)
    console.error(`MongoDB connection failed: ${message}`)
    console.error(`Checked URI: ${env.mongoUri}`)
    console.error('Start MongoDB, update MONGODB_URI in apps/api/.env, then run: npm run seed')
    throw error
  }
}
