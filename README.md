# WarungKu — Manajemen Warung Digital

Aplikasi manajemen warung full-stack berbasis **Next.js 14**, **Supabase**, dan **Tailwind CSS**. Dirancang untuk memudahkan pemilik warung mencatat produk, transaksi, hutang pelanggan, dan melihat laporan keuangan.

---

## ✨ Fitur Utama

| Fitur                   | Deskripsi                                          |
| ----------------------- | -------------------------------------------------- |
| 🔐 **Auth Google**      | Login satu klik via akun Gmail                     |
| 📦 **Manajemen Produk** | CRUD produk + kategori, SKU, margin, stok minimum  |
| 🛒 **Transaksi POS**    | Kasir digital: penjualan, pembelian, pengeluaran   |
| 💳 **Catatan Hutang**   | Catat hutang pelanggan + lunasi sebagian/penuh     |
| 👥 **Pelanggan**        | Data pelanggan + ringkasan hutang                  |
| 📊 **Dashboard**        | Statistik harian, grafik 7 hari, transaksi terbaru |
| 📈 **Laporan**          | Grafik bulanan, tren 6 bulan, breakdown pembayaran |

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Google OAuth
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State**: React Query + Zustand
- **Icons**: Lucide React
- **Font**: Plus Jakarta Sans

---

## 🚀 Cara Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd warung-app
npm install
```

### 2. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) → buat project baru
2. Pergi ke **SQL Editor** → jalankan file `supabase/schema.sql`
3. Pergi ke **Authentication → Providers** → aktifkan **Google**
4. Di Google Cloud Console, buat OAuth credentials:
   - Authorized redirect URI: `https://<project>.supabase.co/auth/v1/callback`
5. Masukkan Client ID & Secret ke Supabase

### 3. Konfigurasi Environment

```bash
cp .env.local.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Jalankan Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📁 Struktur Project

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/               # Login & OAuth callback
│   ├── dashboard/          # Halaman utama
│   ├── products/           # CRUD produk
│   ├── categories/         # Kelola kategori
│   ├── customers/          # Data pelanggan
│   ├── transactions/       # POS & riwayat transaksi
│   ├── debts/              # Catatan hutang
│   └── reports/            # Laporan keuangan
├── components/
│   ├── auth/               # Login form
│   ├── layout/             # Sidebar, Header, AppShell
│   ├── ui/                 # Modal, Badge, EmptyState, dll
│   ├── dashboard/          # Charts dashboard
│   ├── products/           # ProductForm, ProductActions
│   ├── customers/          # CustomerManager
│   ├── transactions/       # TransactionForm (POS)
│   ├── debts/              # DebtForm, DebtPaymentButton
│   └── reports/            # MonthlyBarChart
├── lib/
│   └── supabase.ts         # Supabase client factory
├── types/
│   └── index.ts            # TypeScript types & Database types
├── utils/
│   └── index.ts            # formatCurrency, formatDate, cn, dll
└── middleware.ts            # Auth protection middleware
```

---

## 🗄 Database Schema

Tabel utama:

```
categories      — Kategori produk
products        — Data produk (harga, stok, SKU)
customers       — Data pelanggan
transactions    — Header transaksi
transaction_items — Detail item transaksi
debts           — Hutang pelanggan
debt_payments   — Riwayat pembayaran hutang
```

Semua tabel dilindungi **Row Level Security (RLS)** — setiap user hanya bisa akses datanya sendiri.

---

## 🔄 Alur Transaksi

1. **Penjualan tunai/transfer**: stok otomatis berkurang via database trigger
2. **Penjualan hutang**: stok berkurang + entri hutang otomatis dibuat
3. **Bayar hutang**: klik "Bayar" → pilih jumlah → status hutang diupdate

---

## 🚢 Deploy ke Vercel

```bash
npm run build   # test build lokal
```

Di Vercel:

1. Connect repo
2. Set environment variables yang sama seperti `.env.local`
3. Deploy!

Pastikan di Supabase → **Authentication → URL Configuration** → tambahkan:

```
https://your-app.vercel.app/auth/callback
```

---

## 📄 Lisensi

MIT — bebas digunakan dan dimodifikasi untuk keperluan warung Anda 🏪
