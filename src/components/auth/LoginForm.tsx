'use client'

import { createClient } from '@/lib/supabase'
import { Chrome } from 'lucide-react'
import toast from 'react-hot-toast'

export function LoginForm() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error('Gagal masuk dengan Google. Coba lagi.')
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 border-surface-200 bg-white text-surface-700 font-medium text-sm hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 transition-all duration-150 group"
      >
        {/* Google Icon */}
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.28H1.83v2.08A8 8 0 0 0 8.98 17z"/>
          <path fill="#FBBC05" d="M4.51 10.54A4.9 4.9 0 0 1 4.25 9c0-.54.09-1.06.26-1.54V5.38H1.83A8 8 0 0 0 .98 9c0 1.3.31 2.52.85 3.62l2.68-2.08z"/>
          <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.15 4.38L4.5 7.46c.63-1.89 2.4-3.28 4.48-3.28z"/>
        </svg>
        <span>Masuk dengan Google</span>
        <Chrome size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-surface-400">Aman & terenkripsi</span>
        </div>
      </div>

      <div className="bg-surface-50 rounded-lg px-4 py-3 text-xs text-surface-500 text-center leading-relaxed">
        Kami tidak menyimpan password Anda. Login menggunakan akun Google Anda yang sudah ada.
      </div>
    </div>
  )
}
