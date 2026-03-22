'use client'

import { useState } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui'
import { CategoryForm } from './CategoryForm'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Category } from '@/types'

export function AddCategoryButton({ presetColors }: { presetColors: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus size={16} /> Tambah Kategori
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Tambah Kategori">
        <CategoryForm presetColors={presetColors} onClose={() => setOpen(false)} />
      </Modal>
    </>
  )
}

export function CategoryActions({ category, presetColors }: { category: Category; presetColors: string[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const handleDelete = async () => {
    const { error } = await supabase.from('categories').delete().eq('id', category.id)
    if (error) {
      toast.error('Gagal menghapus. Pastikan kategori tidak memiliki produk.')
    } else {
      toast.success('Kategori dihapus')
      router.refresh()
    }
    setOpen(false)
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400"
        >
          <MoreHorizontal size={15} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-surface-200 shadow-modal py-1 w-36">
              <button
                onClick={() => { setOpen(false); setEditOpen(true) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                <Trash2 size={13} /> Hapus
              </button>
            </div>
          </>
        )}
      </div>
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Kategori">
        <CategoryForm category={category} presetColors={presetColors} onClose={() => setEditOpen(false)} />
      </Modal>
    </>
  )
}
