-- ============================================================
-- MODUL MODAL & INVESTASI
-- Jalankan di Supabase SQL Editor (tambahan dari schema.sql awal)
-- ============================================================

-- Tabel modal entries
create table public.capital_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('initial', 'addition', 'loan', 'investor', 'withdrawal')),
  source text not null,          -- nama sumber: "Modal sendiri", "Bank BRI", "Pak Budi"
  amount numeric(15,2) not null, -- positif = masuk, negatif = keluar (withdrawal)
  date date not null default current_date,
  notes text,
  is_loan boolean default false, -- true jika ini adalah pinjaman (perlu dikembalikan)
  loan_due_date date,            -- jatuh tempo pinjaman (jika is_loan = true)
  loan_paid boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS
alter table public.capital_entries enable row level security;

create policy "Users can view own capital entries"
  on public.capital_entries for select using (auth.uid() = user_id);
create policy "Users can insert own capital entries"
  on public.capital_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own capital entries"
  on public.capital_entries for update using (auth.uid() = user_id);
create policy "Users can delete own capital entries"
  on public.capital_entries for delete using (auth.uid() = user_id);

-- Trigger updated_at
create trigger update_capital_entries_updated_at
  before update on public.capital_entries
  for each row execute function update_updated_at();

-- Index
create index idx_capital_entries_user_id on public.capital_entries(user_id);
create index idx_capital_entries_date on public.capital_entries(date desc);
