// Modal
'use client'

import { X } from 'lucide-react'
import { cn } from '@/utils'
import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className={cn('relative w-full bg-white rounded-2xl shadow-modal animate-scale-in', sizeClass)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="font-semibold text-surface-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// Badge
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const styles = {
    default: 'text-surface-600 bg-surface-100 border-surface-200',
    success: 'text-green-700 bg-green-50 border-green-200',
    warning: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    danger: 'text-red-700 bg-red-50 border-red-200',
    info: 'text-blue-700 bg-blue-50 border-blue-200',
  }
  return (
    <span className={cn('badge', styles[variant], className)}>
      {children}
    </span>
  )
}

// Skeleton loader
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

// Empty state
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center text-surface-400 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-surface-700">{title}</h3>
      {description && <p className="text-xs text-surface-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// Confirm dialog
interface ConfirmProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, description,
  confirmLabel = 'Hapus', loading = false
}: ConfirmProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-surface-600 mb-5">{description}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary btn-sm">Batal</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="btn-danger btn-sm"
        >
          {loading ? 'Loading...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
