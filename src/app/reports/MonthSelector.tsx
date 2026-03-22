'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export function MonthSelector({ selectedMonth }: { selectedMonth: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', e.target.value)
    router.push(`/reports?${params.toString()}`)
  }

  return (
    <select
      className="select w-40"
      value={selectedMonth}
      onChange={handleChange}
    >
      {MONTHS.map((m, i) => (
        <option key={i} value={i + 1}>{m}</option>
      ))}
    </select>
  )
}
