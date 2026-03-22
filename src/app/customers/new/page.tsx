import { CustomerForm } from '@/components/customers/CustomerForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCustomerPage() {
  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/customers" className="btn-ghost btn-sm p-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="page-title">Tambah Pelanggan</h1>
          <p className="text-sm text-surface-400">Daftarkan pelanggan baru</p>
        </div>
      </div>
      <div className="card p-6">
        <CustomerForm />
      </div>
    </div>
  )
}
