# Hospital Management System

Production-shaped monorepo for a hospital workflow with role-based dashboards, JWT auth, MongoDB persistence, Socket.IO realtime updates, registration slips, file uploads, billing, pharmacy handoff, and seed data.

## Stack

- `apps/web`: React, TypeScript, Vite, Tailwind, React Router, Zustand, TanStack Query, React Hook Form, Chart.js, Socket.IO client
- `apps/api`: Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, Socket.IO, Multer, PDFKit, Nodemailer
- `packages/shared`: shared roles, statuses, and workflow constants

## Main Flow

1. Receptionist registers a patient, which creates a patient login, patient ID, appointment, queue token, notification, bill, and printable registration slip.
2. Patient logs in to see queue position, wait time, consultation status, prescriptions, medicine status, billing, reports, and notifications.
3. Doctor opens the live queue, starts consultation, reviews patient profile, adds diagnosis/instructions/prescription, and sends it to pharmacy.
4. Chemist receives prescription, packs medicines, marks ready, notifies the patient, and confirms collection.
5. Admin monitors analytics, users, departments, patients, reports, billing, inventory, and audit logs.

## Run Locally

```bash
npm install
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
npm run seed
npm run dev:api
npm run dev:web
```

The web app runs at `http://localhost:5173` and the API runs at `http://localhost:4000`.

MongoDB must be running locally at `mongodb://127.0.0.1:27017/hospital_management`, or update `apps/api/.env`.

## Seed Logins

All seed users use `Password@123`.

- Admin: `admin@hospital.local`
- Receptionist: `reception@hospital.local`
- Doctor: `doctor@hospital.local`
- Chemist: `chemist@hospital.local`
- Patient: `patient@hospital.local`

## Build

```bash
npm run build
```

The API uses `esbuild` for production output because direct `tsc` compilation of the Mongoose-heavy schema graph can exceed Node heap limits in this environment.

## Docker

```bash
docker compose up --build
```

Web: `http://localhost:8080`

API: `http://localhost:4000`

To seed Docker MongoDB:

```bash
docker compose exec api node apps/api/dist/seed.js
```

## API Summary

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `GET /api/patients`
- `POST /api/patients`
- `PUT /api/patients/:id`
- `DELETE /api/patients/:id`
- `GET /api/patients/:id/slip`
- `POST /api/appointments`
- `GET /api/appointments`
- `GET /api/queue`
- `PUT /api/queue/status`
- `GET /api/doctor/patients`
- `POST /api/doctor/diagnosis`
- `POST /api/doctor/prescription`
- `GET /api/chemist/orders`
- `PUT /api/chemist/status`
- `GET /api/billing`
- `POST /api/billing`
- `GET /api/notifications`
- `POST /api/notifications`
- `POST /api/reports/upload`
- `GET /api/reports`
- `GET /api/admin/analytics`
- `GET /api/admin/users`
- `GET /api/admin/departments`
- `GET /api/admin/doctors`
- `GET /api/admin/inventory`
- `GET /api/admin/audit-logs`

## Prompt To Create Or Extend This Site

```text
Build a production-grade Hospital Management System in a monorepo using React, TypeScript, Vite, Tailwind, Node.js, Express, MongoDB, Mongoose, JWT, Socket.IO, Multer, PDF generation, and Nodemailer.

Create role-based logins for Admin, Receptionist, Doctor, Chemist, and Patient. Receptionist registers patients with basic details, auto-creates a patient account, generates patient ID and queue token, assigns doctor, schedules appointment, prints registration slip, and sends notifications. Patient portal shows queue number, estimated wait time, consultation status, doctor notes, prescription, medicine status, billing, reports, notifications, and profile. Doctor dashboard shows live queue, patient profile, medical history, diagnosis, instructions, prescription creation, follow-up scheduling, report uploads, and sends prescription to chemist. Chemist dashboard receives prescriptions, checks inventory, packs medicines, marks ready, notifies patient, and confirms collection. Admin dashboard manages users, departments, patient records, inventory, reports, audit logs, billing, analytics, and hospital settings.

Use JWT access and refresh tokens, protected frontend routes, role-based backend middleware, password reset/change password, logout, audit logs, responsive sidebar layout, dark mode, search, filters, tables, charts, Socket.IO queue updates, live notifications, medicine-ready updates, QR patient check-in data, file upload, PDF export, seed data, environment examples, README, and Docker Compose.
```
