import { Doctor, Notification, Patient, Prescription, Queue } from '../models/index.js'
import { AppError, asyncHandler } from '../utils/http.js'
import { emitEvent } from '../socket.js'

const currentDoctor = async (userId?: string) => {
  const doctor = await Doctor.findOne({ user: userId })
  if (!doctor) throw new AppError(404, 'Doctor profile not found')
  return doctor
}

export const doctorPatients = asyncHandler(async (req, res) => {
  const doctor = await currentDoctor(req.user?.id)
  const queue = await Queue.find({ doctor: doctor._id, status: { $in: ['waiting', 'called', 'in-consultation'] } })
    .sort({ position: 1 })
    .populate('patient department')
  res.json({ doctor, queue })
})

export const addDiagnosis = asyncHandler(async (req, res) => {
  const doctor = await currentDoctor(req.user?.id)
  const patient = await Patient.findById(req.body.patient)
  if (!patient) throw new AppError(404, 'Patient not found')
  const prescription = await Prescription.create({
    patient: patient._id,
    doctor: doctor._id,
    diagnosis: req.body.diagnosis,
    instructions: req.body.instructions,
    doList: req.body.doList ?? [],
    dontList: req.body.dontList ?? [],
    vitals: req.body.vitals,
    followUpAt: req.body.followUpAt,
    medicines: []
  })
  await Queue.findOneAndUpdate({ patient: patient._id, doctor: doctor._id, status: 'in-consultation' }, { status: 'completed', completedAt: new Date() })
  res.status(201).json({ prescription })
})

export const createPrescription = asyncHandler(async (req, res) => {
  const doctor = await currentDoctor(req.user?.id)
  const patient = await Patient.findById(req.body.patient)
  if (!patient) throw new AppError(404, 'Patient not found')
  const prescription = await Prescription.create({
    patient: patient._id,
    doctor: doctor._id,
    diagnosis: req.body.diagnosis,
    instructions: req.body.instructions,
    doList: req.body.doList ?? [],
    dontList: req.body.dontList ?? [],
    followUpAt: req.body.followUpAt,
    vitals: req.body.vitals,
    medicines: req.body.medicines,
    status: 'sent-to-chemist',
    sentToChemistAt: new Date()
  })
  await Queue.findOneAndUpdate({ patient: patient._id, doctor: doctor._id }, { status: 'completed', completedAt: new Date() }, { sort: { createdAt: -1 } })
  if (patient.user) {
    await Notification.create({
      user: patient.user,
      patient: patient._id,
      type: 'medicine',
      title: 'Prescription sent',
      message: 'Your prescription has been sent to the pharmacy.'
    })
    emitEvent('notification:new', { title: 'Prescription sent' }, `user:${patient.user}`)
  }
  emitEvent('chemist:order:new', { prescription }, 'role:chemist')
  emitEvent('queue:update', { patient: patient._id })
  res.status(201).json({ prescription })
})
