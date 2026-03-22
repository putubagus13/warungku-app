'use client'

import Link from 'next/link'
import {
  ShoppingCart, Package, CreditCard,
  Users, BarChart3, Plus, Landmark, Tag
} from 'lucide-react'

const shortcuts = [
  {
    label: 'Jual Sekarang',
    desc: 'Catat penjualan',
    href: '/transactions/new',
    icon: ShoppingCart,
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bg: 'bg-green-50 hover:bg-green-100 border-green-200',
    primary: true,
  },
  {
    label: 'Tambah Produk',
    desc: 'Produk baru',
    href: '/products/new',
    icon: Plus,
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  {
    label: 'Catat Hutang',
    desc: 'Hutang pelanggan',
    href: '/debts/new',
    icon: CreditCard,
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
  },
  {
    label: 'Pelanggan',
    desc: 'Data pelanggan',
    href: '/customers',
    icon: Users,
    color: 'bg-violet-500',
    textColor: 'text-violet-700',
    bg: 'bg-violet-50 hover:bg-violet-100 border-violet-200',
  },
  {
    label: 'Laporan',
    desc: 'Analisis keuangan',
    href: '/reports',
    icon: BarChart3,
    color: 'bg-teal-500',
    textColor: 'text-teal-700',
    bg: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
  },
  {
    label: 'Modal',
    desc: 'Modal & investasi',
    href: '/capital',
    icon: Landmark,
    color: 'bg-pink-500',
    textColor: 'text-pink-700',
    bg: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
  },
]

export function QuickActions() {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-surface-800 text-sm mb-3">Akses Cepat</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-150 group ${s.bg}`}
          >
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
              <s.icon size={17} className="text-white" />
            </div>
            <div className="text-center">
              <p className={`text-xs font-semibold leading-tight ${s.textColor}`}>{s.label}</p>
              <p className="text-[10px] text-surface-400 mt-0.5 leading-tight hidden sm:block">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
