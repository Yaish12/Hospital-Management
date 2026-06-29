import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Upload, ExternalLink, FileUp, FlaskConical } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api, fetcher } from '../lib/api'
import type { Report } from '../lib/types'

type UploadValues = {
  patient: string
  title: string
  type: string
  notes: string
}

const LAB_TESTS = [
  'Complete Blood Count',
  'Blood Sugar Fasting',
  'Blood Sugar PP',
  'Liver Function Test',
  'Kidney Function Test',
  'Lipid Profile',
  'Thyroid Profile',
  'Urine Routine',
  'Electrolytes',
  'X-Ray / Radiology'
]

export function ReportsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => fetcher<{ reports: Report[] }>('/reports')
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => fetcher<{ patients: any[] }>('/patients')
  })

  const { register, handleSubmit, reset } = useForm<UploadValues>({
    defaultValues: { type: 'clinical' }
  })

  const uploadMutation = useMutation({
    mutationFn: async (values: UploadValues) => {
      const formData = new FormData()
      formData.append('patient', values.patient)
      formData.append('title', values.title)
      formData.append('type', values.type)
      formData.append('notes', values.notes)
      const file = fileRef.current?.files?.[0]
      if (file) formData.append('file', file)
      return api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      toast.success('Report uploaded successfully')
      reset()
      if (fileRef.current) fileRef.current.value = ''
      setIsModalOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Upload failed')
  })

  const reports = data?.reports ?? []
  const apiBase = import.meta.env.VITE_API_URL ?? '/api'
  const fileBase = apiBase.replace('/api', '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Patient Reports</h1>
          <p className="text-sm text-slate-500">Upload and manage clinical reports and diagnostic files.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Upload className="h-4 w-4" /> Upload Report
        </button>
      </div>

      <section className="panel p-4">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <FlaskConical className="h-4 w-4 text-teal" /> Laboratory Test List
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {LAB_TESTS.map((test) => (
            <div key={test} className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              {test}
            </div>
          ))}
        </div>
      </section>

      {/* Reports grid */}
      {isLoading && <div className="panel p-8 text-center text-slate-400">Loading reports…</div>}

      {!isLoading && reports.length === 0 && (
        <div className="panel p-12 text-center">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No reports uploaded yet.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const patient = typeof report.patient === 'object' ? report.patient : null
          const fileUrl = report.fileUrl.startsWith('http') ? report.fileUrl : `${fileBase}${report.fileUrl}`
          return (
            <article key={report._id} className="panel p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-coral/10 grid place-items-center shrink-0">
                    <FileText className="h-4 w-4 text-coral" />
                  </div>
                  <div>
                    <h3 className="font-semibold leading-tight">{report.title}</h3>
                    <p className="text-xs text-slate-500 capitalize">{report.type}</p>
                  </div>
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-teal transition shrink-0"
                  title="Open file"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {patient && (
                <div className="rounded-md bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm">
                  <span className="text-slate-500">Patient: </span>
                  <span className="font-medium">{patient.name}</span>
                  <span className="text-slate-400 ml-2 text-xs">{patient.patientId}</span>
                </div>
              )}

              {report.notes && (
                <p className="text-sm text-slate-500 line-clamp-2">{report.notes}</p>
              )}

              <div className="flex items-center justify-between mt-auto">
                <p className="text-xs text-slate-400">
                  {report.uploadedBy ? `Uploaded by ${report.uploadedBy.name}` : 'System upload'}
                </p>
                <p className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleDateString()}</p>
              </div>
            </article>
          )
        })}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-xl rounded-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileUp className="h-5 w-5 text-teal" /> Upload Patient Report
            </h3>
            <form onSubmit={handleSubmit((v) => uploadMutation.mutate(v))} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Patient</label>
                <select className="field" {...register('patient', { required: true })}>
                  <option value="">Select patient</option>
                  {(patientsData?.patients ?? []).map((p) => (
                    <option key={p._id} value={p._id}>{p.name} — {p.patientId}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Report Title</label>
                <input className="field" placeholder="e.g. Blood Test Results" {...register('title', { required: true })} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Report Type</label>
                <select className="field" {...register('type')}>
                  <option value="clinical">Clinical</option>
                  <option value="radiology">Radiology</option>
                  <option value="pathology">Pathology</option>
                  <option value="lab">Lab</option>
                  <option value="discharge">Discharge Summary</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">File</label>
                <input
                  type="file"
                  ref={fileRef}
                  className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-teal file:text-white file:text-sm file:font-medium hover:file:bg-teal/90 cursor-pointer"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <p className="text-xs text-slate-400 mt-1">PDF, images, or documents accepted.</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Notes</label>
                <textarea className="textarea" placeholder="Any additional notes about this report…" {...register('notes')} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? 'Uploading…' : 'Upload Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
