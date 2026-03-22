import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num)
}

export function formatDate(dateStr: string, fmt = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: id })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, 'dd MMM yyyy, HH:mm')
}

export function formatRelative(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays < 7) return `${diffDays} hari lalu`
    return formatDate(dateStr)
  } catch {
    return dateStr
  }
}

export function generateSKU(name: string): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3)
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6)
  return `${prefix}-${suffix}`
}

export function getDebtStatusColor(status: string) {
  switch (status) {
    case 'paid': return 'text-green-600 bg-green-50 border-green-200'
    case 'partial': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'unpaid': return 'text-red-600 bg-red-50 border-red-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function getDebtStatusLabel(status: string) {
  switch (status) {
    case 'paid': return 'Lunas'
    case 'partial': return 'Sebagian'
    case 'unpaid': return 'Belum Bayar'
    default: return status
  }
}

export function getTransactionTypeLabel(type: string) {
  switch (type) {
    case 'sale': return 'Penjualan'
    case 'purchase': return 'Pembelian'
    case 'expense': return 'Pengeluaran'
    default: return type
  }
}

export function getPaymentMethodLabel(method: string) {
  switch (method) {
    case 'cash': return 'Tunai'
    case 'transfer': return 'Transfer'
    case 'debt': return 'Hutang'
    default: return method
  }
}

export function calculateMargin(price: number, costPrice: number): number {
  if (costPrice === 0) return 0
  return ((price - costPrice) / costPrice) * 100
}

export function truncate(str: string, length = 30): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
