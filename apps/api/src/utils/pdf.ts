import PDFDocument from 'pdfkit'
import type { PatientDocument } from '../models/index.js'

export const registrationSlipPdf = (patient: PatientDocument, token?: string) =>
  new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ margin: 48 })
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.fontSize(20).text('Hospital Registration Slip')
    doc.moveDown()
    doc.fontSize(12).text(`Patient ID: ${patient.patientId}`)
    doc.text(`Name: ${patient.name}`)
    doc.text(`Phone: ${patient.phone}`)
    doc.text(`Department: ${patient.departmentName ?? 'General'}`)
    if (token) doc.text(`Queue Token: ${token}`)
    doc.moveDown().text('Please keep this slip for check-in, billing, and medicine collection.')
    doc.end()
  })
