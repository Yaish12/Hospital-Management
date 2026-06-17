import { Notification, Queue } from '../models/index.js'
import { AppError, asyncHandler } from '../utils/http.js'
import { emitEvent } from '../socket.js'

export const listQueue = asyncHandler(async (req, res) => {
  const status = req.query.status ? String(req.query.status).split(',') : undefined
  const filter = status ? { status: { $in: status } } : {}
  const queue = await Queue.find(filter).sort({ position: 1 }).populate('patient doctor department appointment')
  res.json({ queue })
})

export const updateQueueStatus = asyncHandler(async (req, res) => {
  const { queueId, status } = req.body
  const patch: Record<string, unknown> = { status }
  if (status === 'called') patch.calledAt = new Date()
  if (status === 'completed') patch.completedAt = new Date()
  const queue = await Queue.findByIdAndUpdate(queueId, patch, { new: true }).populate('patient doctor department')
  if (!queue) throw new AppError(404, 'Queue item not found')

  const patient = (queue as any).patient
  if (patient?.user) {
    await Notification.create({
      user: patient.user,
      patient: patient._id,
      type: 'queue',
      title: 'Queue updated',
      message: `Your consultation status is now ${status}.`
    })
    emitEvent('notification:new', { title: 'Queue updated', status }, `user:${patient.user}`)
  }
  emitEvent('queue:update', { queue })
  res.json({ queue })
})
