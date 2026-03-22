'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { formatCurrency } from '@/utils'

interface Props {
  data: { date: string; revenue: number; expense: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-surface-200 rounded-lg shadow-modal p-3 text-xs">
        <p className="font-semibold text-surface-700 mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-surface-500">{p.name}:</span>
            <span className="font-medium text-surface-800">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
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
        <Area
          type="monotone"
          dataKey="revenue"
          name="revenue"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#revenue)"
          dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="expense"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#expense)"
          dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
