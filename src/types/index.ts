// ============================================================
// DATABASE TYPES (mirrors Supabase schema)
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Product, "id" | "created_at">>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Customer, "id" | "created_at">>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at">;
        Update: Partial<Omit<Transaction, "id" | "created_at">>;
      };
      transaction_items: {
        Row: TransactionItem;
        Insert: Omit<TransactionItem, "id">;
        Update: Partial<Omit<TransactionItem, "id">>;
      };
      debts: {
        Row: Debt;
        Insert: Omit<Debt, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Debt, "id" | "created_at">>;
      };
      debt_payments: {
        Row: DebtPayment;
        Insert: Omit<DebtPayment, "id" | "created_at">;
        Update: Partial<Omit<DebtPayment, "id" | "created_at">>;
      };
    };
  };
}

// ============================================================
// ENTITY TYPES
// ============================================================

export interface Category {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  price: number; // selling price
  cost_price: number; // purchase price
  stock: number;
  unit: string; // pcs, kg, liter, etc.
  min_stock: number; // alert when below this
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  category?: Category;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = "sale" | "purchase" | "expense";
export type TransactionStatus = "completed" | "pending" | "cancelled";
export type PaymentMethod = "cash" | "transfer" | "debt";

export interface Transaction {
  id: string;
  user_id: string;
  customer_id: string | null;
  type: TransactionType;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  total_amount: number;
  paid_amount: number;
  notes: string | null;
  created_at: string;
  // joined
  customer?: Customer;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  // joined
  product?: Product;
}

export type DebtStatus = "unpaid" | "partial" | "paid";

export interface Debt {
  id: string;
  user_id: string;
  customer_id: string;
  transaction_id: string | null;
  original_amount: number;
  remaining_amount: number;
  status: DebtStatus;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  customer?: Customer;
  transaction?: Transaction;
  payments?: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
}

// ============================================================
// UI / FORM TYPES
// ============================================================

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}

export interface DashboardStats {
  today_revenue: number;
  today_transactions: number;
  total_debt: number;
  low_stock_count: number;
  monthly_revenue: number[];
  top_products: { name: string; total: number }[];
  recent_transactions: Transaction[];
}

export interface ProductFormData {
  name: string;
  sku: string;
  category_id: string;
  description: string;
  price: number;
  cost_price: number;
  stock: number;
  unit: string;
  min_stock: number;
  is_active: boolean;
}

export interface TransactionFormData {
  customer_id: string;
  type: TransactionType;
  payment_method: PaymentMethod;
  items: CartItem[];
  notes: string;
}

export interface DebtFormData {
  customer_id: string;
  original_amount: number;
  due_date: string;
  notes: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface FilterParams {
  search?: string;
  category_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================================
// CAPITAL / MODAL TYPES
// ============================================================

export type CapitalType =
  | "initial"
  | "addition"
  | "loan"
  | "investor"
  | "withdrawal";

export interface CapitalEntry {
  id: string;
  user_id: string;
  type: CapitalType;
  source: string;
  amount: number;
  date: string;
  notes: string | null;
  is_loan: boolean;
  loan_due_date: string | null;
  loan_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface CapitalSummary {
  total_modal: number; // total modal masuk (non-loan)
  total_loan: number; // total pinjaman aktif
  total_withdrawal: number; // total penarikan
  total_revenue: number; // total pendapatan dari transaksi
  total_expense: number; // total pengeluaran dari transaksi
  cash_balance: number; // saldo kas bersih
  stock_value: number; // estimasi nilai stok
  net_worth: number; // total aset bersih
  roi: number; // return on investment %
}
