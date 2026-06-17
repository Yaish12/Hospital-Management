import { connectDb } from './config/db.js'
import { Appointment, Billing, Chemist, Department, Doctor, Inventory, Medicine, Notification, Patient, Queue, Receptionist, User } from './models/index.js'
import { hashPassword } from './utils/auth.js'

const seed = async () => {
  await connectDb()
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    Receptionist.deleteMany({}),
    Chemist.deleteMany({}),
    Appointment.deleteMany({}),
    Queue.deleteMany({}),
    Medicine.deleteMany({}),
    Inventory.deleteMany({}),
    Billing.deleteMany({}),
    Notification.deleteMany({})
  ])

  const passwordHash = await hashPassword('Password@123')
  const [cardiology, general, pharmacy] = await Department.create([
    { name: 'Cardiology', code: 'CARD', floor: '2', description: 'Heart and vascular care' },
    { name: 'General Medicine', code: 'GEN', floor: '1', description: 'Primary consultation' },
    { name: 'Pharmacy', code: 'PHAR', floor: 'G', description: 'Medicine dispensing' }
  ])

  const [admin, receptionistUser, doctorUser, chemistUser, patientUser] = await User.create([
    { name: 'Admin User', email: 'admin@hospital.local', phone: '9000000001', role: 'admin', passwordHash },
    { name: 'Reception Desk', email: 'reception@hospital.local', phone: '9000000002', role: 'receptionist', passwordHash },
    { name: 'Dr. Asha Mehta', email: 'doctor@hospital.local', phone: '9000000003', role: 'doctor', passwordHash },
    { name: 'Chemist Desk', email: 'chemist@hospital.local', phone: '9000000004', role: 'chemist', passwordHash },
    { name: 'Ravi Kumar', email: 'patient@hospital.local', phone: '9000000005', role: 'patient', passwordHash }
  ])

  const doctor = await Doctor.create({
    user: doctorUser._id,
    employeeId: 'DOC-001',
    specialization: 'Internal Medicine',
    department: general._id,
    room: '102',
    consultationFee: 600,
    availability: [{ day: 'Mon-Fri', start: '09:00', end: '17:00' }]
  })
  await Receptionist.create({ user: receptionistUser._id, employeeId: 'REC-001', shift: 'Morning', counter: 'A1' })
  await Chemist.create({ user: chemistUser._id, employeeId: 'CHM-001', shift: 'Morning', counter: 'P1' })

  const patient = await Patient.create({
    user: patientUser._id,
    patientId: 'PAT-2026-DEMO01',
    name: 'Ravi Kumar',
    email: 'patient@hospital.local',
    phone: '9000000005',
    age: 32,
    gender: 'male',
    bloodGroup: 'B+',
    address: 'Pune',
    allergies: ['Penicillin'],
    medicalHistory: ['Seasonal asthma'],
    department: general._id,
    departmentName: 'General Medicine',
    qrCode: 'HMS:DEMO:PAT-2026-DEMO01'
  })

  const appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctor._id,
    department: general._id,
    scheduledAt: new Date(),
    reason: 'Fever and cough',
    status: 'checked-in'
  })

  await Queue.create({
    token: 'Q-001',
    patient: patient._id,
    doctor: doctor._id,
    appointment: appointment._id,
    department: general._id,
    position: 1,
    estimatedWaitMinutes: 15
  })

  const [paracetamol, cetirizine, antacid] = await Medicine.create([
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Analgesic', unit: 'tablet', price: 2 },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine', category: 'Antihistamine', unit: 'tablet', price: 3 },
    { name: 'Antacid Syrup', genericName: 'Aluminium Hydroxide', category: 'Digestive', unit: 'bottle', price: 80 }
  ])

  await Inventory.create([
    { medicine: paracetamol._id, batchNo: 'PCM-01', quantity: 180, reorderLevel: 40, location: 'Rack A' },
    { medicine: cetirizine._id, batchNo: 'CTZ-01', quantity: 120, reorderLevel: 30, location: 'Rack B' },
    { medicine: antacid._id, batchNo: 'ANT-01', quantity: 25, reorderLevel: 20, location: 'Rack C' }
  ])

  await Billing.create({
    patient: patient._id,
    appointment: appointment._id,
    items: [{ label: 'Consultation', amount: 600 }],
    subtotal: 600,
    total: 600,
    status: 'unpaid'
  })

  await Notification.create({
    user: patientUser._id,
    patient: patient._id,
    title: 'Welcome to City Care Hospital',
    message: 'Your demo queue token is Q-001.',
    type: 'queue'
  })

  console.info('Seed complete. Login with admin/reception/doctor/chemist/patient @hospital.local and Password@123')
  console.info(`Created admin ${admin.email}, departments: ${cardiology.name}, ${general.name}, ${pharmacy.name}`)
  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
