import { Inventory, Notification, Prescription } from '../models/index.js'
import { AppError, asyncHandler } from '../utils/http.js'
import { emitEvent } from '../socket.js'

export const chemistOrders = asyncHandler(async (_req, res) => {
  const orders = await Prescription.find({ status: { $in: ['sent-to-chemist', 'packing', 'ready'] } })
    .sort({ createdAt: -1 })
    .populate('patient doctor medicines.medicine')
  res.json({ orders })
})

export const updateChemistStatus = asyncHandler(async (req, res) => {
  const { prescriptionId, status } = req.body
  const patch: Record<string, unknown> = { status }
  if (status === 'ready') patch.readyAt = new Date()
  if (status === 'collected') patch.collectedAt = new Date()
  const prescription = await Prescription.findByIdAndUpdate(prescriptionId, patch, { new: true }).populate('patient')
  if (!prescription) throw new AppError(404, 'Prescription not found')

  if (status === 'collected') {
    for (const item of (prescription as any).medicines ?? []) {
      if (item.medicine) await Inventory.findOneAndUpdate({ medicine: item.medicine }, { $inc: { quantity: -Math.max(item.quantity ?? 1, 0) } })
    }
  }

  const patient = (prescription as any).patient
  if (patient?.user) {
    await Notification.create({
      user: patient.user,
      patient: patient._id,
      type: 'medicine',
      title: status === 'ready' ? 'Medicines ready' : 'Medicine status updated',
      message: status === 'ready' ? 'Your medicines are packed and ready to pick up.' : `Medicine order is ${status}.`
    })
    emitEvent('medicine:ready', { prescriptionId, status }, `user:${patient.user}`)
  }

  emitEvent('chemist:order:update', { prescription }, 'role:chemist')
  res.json({ prescription })
})
