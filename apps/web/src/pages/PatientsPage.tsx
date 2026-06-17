import { useQuery } from '@tanstack/react-query'
import { Search, User, X, FileText, Phone, MapPin, Droplets, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Patient } from '../lib/types'

export function PatientsPage() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') ?? '')
  const [selected, setSelected] = useState<Patient | null>(null)
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Sync URL param → search on mount / URL change
  useEffect(() => {
    const param = searchParams.get('search') ?? ''
    setSearch(param)
    setDebouncedSearch(param)
  }, [searchParams])

  const handleSearch = (value: string) => {
    setSearch(value)
    if (searchTimer) clearTimeout(searchTimer)
    const t = setTimeout(() => setDebouncedSearch(value), 400)
    setSearchTimer(t)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['patients-page', debouncedSearch],
    queryFn: () => {
      const params = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''
      return api.get(`/patients${params}`).then((r) => r.data as { patients: Patient[] })
    }
  })

  const patients = data?.patients ?? []

  return (
    <div className="flex gap-6 h-full">
      {/* List panel */}
      <div className={`flex flex-col gap-4 ${selected ? 'hidden xl:flex xl:w-[420px] shrink-0' : 'w-full'}`}>
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-sm text-slate-500">Search and view all registered patients.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="field pl-9"
            placeholder="Search by name, phone, or patient ID…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Count */}
        <p className="text-xs text-slate-500">{patients.length} patient{patients.length !== 1 ? 's' : ''} found</p>

        {/* Patient list */}
        <div className="panel overflow-hidden flex-1">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading && (
              <div className="p-8 text-center text-slate-400">Searching…</div>
            )}
            {!isLoading && patients.length === 0 && (
              <div className="p-8 text-center text-slate-400">No patients found.</div>
            )}
            {patients.map((patient) => (
              <button
                key={patient._id}
                className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition ${selected?._id === patient._id ? 'bg-teal/5 border-l-2 border-teal' : ''}`}
                onClick={() => setSelected(patient)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-teal/10 grid place-items-center shrink-0">
                    <User className="h-4 w-4 text-teal" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{patient.name}</p>
                    <p className="text-xs text-slate-500">{patient.patientId} · {patient.phone}</p>
                  </div>
                  <div className="ml-auto shrink-0">
                    <span className="text-xs text-slate-400">{patient.departmentName ?? 'General'}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="flex-1 xl:flex-none xl:w-auto xl:flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Patient Details</h2>
            <button
              className="btn-secondary w-9 h-9 px-0"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Profile card */}
          <div className="panel p-5">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-teal/10 grid place-items-center shrink-0">
                <User className="h-7 w-7 text-teal" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.patientId}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selected.gender && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs capitalize">{selected.gender}</span>
                  )}
                  {selected.age && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs">{selected.age} yrs</span>
                  )}
                  {selected.bloodGroup && (
                    <span className="rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-2 py-0.5 text-xs flex items-center gap-1">
                      <Droplets className="h-3 w-3" />{selected.bloodGroup}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 text-sm">
                <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="font-medium">{selected.phone}</p>
                </div>
              </div>
              {selected.email && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium truncate">{selected.email}</p>
                  </div>
                </div>
              )}
              {selected.address && (
                <div className="flex items-start gap-2 text-sm sm:col-span-2">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="font-medium">{selected.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medical info */}
          {(selected.allergies?.length || selected.medicalHistory?.length) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {selected.allergies && selected.allergies.length > 0 && (
                <div className="panel p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber mb-3 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Allergies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.allergies.map((a) => (
                      <span key={a} className="rounded-md bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-medium">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {selected.medicalHistory && selected.medicalHistory.length > 0 && (
                <div className="panel p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Medical History
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.medicalHistory.map((h) => (
                      <span key={h} className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium">{h}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Department */}
          <div className="panel p-4">
            <p className="text-xs text-slate-500 mb-1">Assigned Department</p>
            <p className="font-semibold">{selected.departmentName ?? 'General'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
