import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WarungKu - Manajemen Warung Digital',
  description: 'Kelola warung Anda dengan mudah dan efisien',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-surface-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
