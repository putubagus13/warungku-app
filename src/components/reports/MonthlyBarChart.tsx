'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { formatCurrency } from '@/utils'

interface Props {
  data: { month: string; revenue: number; expense: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-surface-200 rounded-lg shadow-modal p-3 text-xs">
        <p className="font-semibold text-surface-700 mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
            <span className="text-surface-500">{p.name}:</span>
            <span className="font-medium text-surface-800">{formatCurrency(p.value)}</span>
          </div>
        ))}
        <div className="mt-1.5 pt-1.5 border-t border-surface-100">
          <span className="text-surface-500">Laba: </span>
          <span className={`font-semibold ${payload[0]?.value - (payload[1]?.value || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(payload[0]?.value - (payload[1]?.value || 0))}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export function MonthlyBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v / 1000}k`}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 11, color: '#71717a' }}>
              {value === 'revenue' ? 'Pendapatan' : 'Pengeluaran'}
            </span>
          )}
        />
        <Bar dataKey="revenue" name="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="expense" name="expense" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
