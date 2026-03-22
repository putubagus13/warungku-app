'use client'

import { useRouter } from 'next/navigation'

interface Props {
  selectedMonth: number
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export function MonthFilter({ selectedMonth }: Props) {
  const router = useRouter()

  return (
    <select
      className="select w-44"
      value={selectedMonth}
      onChange={(e) => router.push(`/reports?month=${e.target.value}`)}
    >
      {MONTHS.map((m, i) => (
        <option key={i} value={i + 1}>{m}</option>
      ))}
    </select>
  )
}
