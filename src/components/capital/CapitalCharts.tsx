'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/utils'

interface Props {
  data: {
    modal: number
    investor: number
    loan: number
    revenue: number
    expense: number
  }
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#22c55e', '#ef4444']

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-surface-200 rounded-lg shadow-modal p-2.5 text-xs">
        <p className="font-medium text-surface-700">{payload[0].name}</p>
        <p className="text-surface-800 font-bold mt-0.5">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function CapitalCharts({ data }: Props) {
  const chartData = [
    { name: 'Modal Sendiri', value: data.modal },
    { name: 'Investor', value: data.investor },
    { name: 'Pinjaman', value: data.loan },
    { name: 'Pendapatan', value: data.revenue },
  ].filter(d => d.value > 0)

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-surface-400">
        <p className="text-sm">Belum ada data modal</p>
        <p className="text-xs mt-1">Tambahkan modal pertama Anda</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={75}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 11, color: '#71717a' }}>{value}</span>
          )}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
