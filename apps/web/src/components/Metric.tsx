import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: string
}

export function Metric({ label, value, icon: Icon, tone = 'text-teal' }: Props) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
        </div>
        <Icon className={`h-6 w-6 ${tone}`} />
      </div>
    </div>
  )
}
