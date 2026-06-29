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
  if (!['sent-to-chemist', 'packing', 'ready', 'collected'].includes(status)) throw new AppError(400, 'Invalid prescription status')
  const prescription = await Prescription.findById(prescriptionId).populate('patient medicines.medicine')
  if (!prescription) throw new AppError(404, 'Prescription not found')

  if (status === 'collected') {
    for (const item of (prescription as any).medicines ?? []) {
      const medicineId = item.medicine?._id ?? item.medicine
      if (!medicineId) continue
      const stock = await Inventory.findOne({ medicine: medicineId }).sort({ expiryDate: 1 })
      const required = Math.max(Number(item.quantity ?? 1), 1)
      if (!stock || stock.quantity < required) {
        throw new AppError(400, `${item.name} is not available in required quantity`)
      }
    }
  }

  ;(prescription as any).status = status
  if (status === 'ready') (prescription as any).readyAt = new Date()
  if (status === 'collected') (prescription as any).collectedAt = new Date()
  await prescription.save()

  if (status === 'collected') {
    for (const item of (prescription as any).medicines ?? []) {
      const medicineId = item.medicine?._id ?? item.medicine
      if (medicineId) {
        await Inventory.findOneAndUpdate(
          { medicine: medicineId, quantity: { $gte: Math.max(Number(item.quantity ?? 1), 1) } },
          { $inc: { quantity: -Math.max(Number(item.quantity ?? 1), 1) } },
          { sort: { expiryDate: 1 } }
        )
      }
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
