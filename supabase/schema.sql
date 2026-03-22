-- ============================================================
-- WARUNG APP - SUPABASE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  color text default '#22c55e',
  icon text default 'tag',
  created_at timestamptz default now() not null,
  unique(user_id, name)
);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  sku text,
  description text,
  price numeric(15,2) not null default 0,
  cost_price numeric(15,2) not null default 0,
  stock integer not null default 0,
  unit text not null default 'pcs',
  min_stock integer not null default 5,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- CUSTOMERS TABLE
-- ============================================================
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  address text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete set null,
  type text not null check (type in ('sale', 'purchase', 'expense')),
  status text not null default 'completed' check (status in ('completed', 'pending', 'cancelled')),
  payment_method text not null default 'cash' check (payment_method in ('cash', 'transfer', 'debt')),
  total_amount numeric(15,2) not null default 0,
  paid_amount numeric(15,2) not null default 0,
  notes text,
  created_at timestamptz default now() not null
);

-- ============================================================
-- TRANSACTION ITEMS TABLE
-- ============================================================
create table public.transaction_items (
  id uuid default uuid_generate_v4() primary key,
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete restrict not null,
  quantity integer not null default 1,
  unit_price numeric(15,2) not null default 0,
  subtotal numeric(15,2) not null default 0
);

-- ============================================================
-- DEBTS TABLE
-- ============================================================
create table public.debts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete restrict not null,
  transaction_id uuid references public.transactions(id) on delete set null,
  original_amount numeric(15,2) not null,
  remaining_amount numeric(15,2) not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid')),
  due_date date,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- DEBT PAYMENTS TABLE
-- ============================================================
create table public.debt_payments (
  id uuid default uuid_generate_v4() primary key,
  debt_id uuid references public.debts(id) on delete cascade not null,
  amount numeric(15,2) not null,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'transfer', 'debt')),
  notes text,
  created_at timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;

-- Categories policies
create policy "Users can view own categories" on public.categories for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on public.categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on public.categories for delete using (auth.uid() = user_id);

-- Products policies
create policy "Users can view own products" on public.products for select using (auth.uid() = user_id);
create policy "Users can insert own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on public.products for update using (auth.uid() = user_id);
create policy "Users can delete own products" on public.products for delete using (auth.uid() = user_id);

-- Customers policies
create policy "Users can view own customers" on public.customers for select using (auth.uid() = user_id);
create policy "Users can insert own customers" on public.customers for insert with check (auth.uid() = user_id);
create policy "Users can update own customers" on public.customers for update using (auth.uid() = user_id);
create policy "Users can delete own customers" on public.customers for delete using (auth.uid() = user_id);

-- Transactions policies
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- Transaction items policies (via transaction ownership)
create policy "Users can view own transaction items" on public.transaction_items for select
  using (exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()));
create policy "Users can insert own transaction items" on public.transaction_items for insert
  with check (exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()));
create policy "Users can delete own transaction items" on public.transaction_items for delete
  using (exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()));

-- Debts policies
create policy "Users can view own debts" on public.debts for select using (auth.uid() = user_id);
create policy "Users can insert own debts" on public.debts for insert with check (auth.uid() = user_id);
create policy "Users can update own debts" on public.debts for update using (auth.uid() = user_id);
create policy "Users can delete own debts" on public.debts for delete using (auth.uid() = user_id);

-- Debt payments policies (via debt ownership)
create policy "Users can view own debt payments" on public.debt_payments for select
  using (exists (select 1 from public.debts d where d.id = debt_id and d.user_id = auth.uid()));
create policy "Users can insert own debt payments" on public.debt_payments for insert
  with check (exists (select 1 from public.debts d where d.id = debt_id and d.user_id = auth.uid()));

-- ============================================================
-- TRIGGERS - Auto update updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_products_updated_at before update on public.products
  for each row execute function update_updated_at();

create trigger update_customers_updated_at before update on public.customers
  for each row execute function update_updated_at();

create trigger update_debts_updated_at before update on public.debts
  for each row execute function update_updated_at();

-- ============================================================
-- TRIGGERS - Auto update stock on transaction
-- ============================================================
create or replace function update_product_stock()
returns trigger as $$
declare
  trans_type text;
begin
  select type into trans_type from public.transactions where id = new.transaction_id;
  
  if trans_type = 'sale' then
    update public.products set stock = stock - new.quantity where id = new.product_id;
  elsif trans_type = 'purchase' then
    update public.products set stock = stock + new.quantity where id = new.product_id;
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger auto_update_stock after insert on public.transaction_items
  for each row execute function update_product_stock();

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index idx_products_user_id on public.products(user_id);
create index idx_products_category_id on public.products(category_id);
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_created_at on public.transactions(created_at desc);
create index idx_debts_user_id on public.debts(user_id);
create index idx_debts_customer_id on public.debts(customer_id);
create index idx_debts_status on public.debts(status);
