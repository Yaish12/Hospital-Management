import { useEffect, useRef } from 'react'
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

type Props = {
  labels: string[]
  values: number[]
}

export function ChartPanel({ labels, values }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: ['#0f766e', '#e76f51', '#f4a261', '#6a994e', '#3b82f6'] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    })
    return () => chart.destroy()
  }, [labels, values])

  return (
    <div className="panel h-72 p-4">
      <canvas ref={ref} aria-label="Hospital analytics chart" />
    </div>
  )
}
