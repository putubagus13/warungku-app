'use client'

import { Bell, Search, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import Image from 'next/image'

export function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase])

  const avatarUrl = user?.user_metadata?.avatar_url
  const fullName = user?.user_metadata?.full_name || user?.email || 'User'

  return (
    <header className="h-14 px-6 flex items-center justify-between bg-white border-b border-surface-200 sticky top-0 z-10">
      {/* Search bar */}
      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          type="search"
          placeholder="Cari produk, transaksi..."
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 placeholder:text-surface-400"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="relative w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-500 transition-colors">
          <Bell size={16} />
        </button>

        <div className="flex items-center gap-2.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={fullName}
              width={30}
              height={30}
              className="rounded-full ring-2 ring-surface-200"
            />
          ) : (
            <div className="w-7.5 h-7.5 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
              <User size={14} />
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-surface-800 leading-none">{fullName.split(' ')[0]}</p>
            <p className="text-[10px] text-surface-400 mt-0.5">Admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
