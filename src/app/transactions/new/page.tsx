import { createServerClient } from "@/lib/supabase-server";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewTransactionPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name, color)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .gt("stock", 0)
    .order("name");

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/transactions" className="btn-ghost btn-sm">
          <ArrowLeft size={16} /> Kembali
        </Link>
        <div>
          <h1 className="page-title">Transaksi Baru</h1>
          <p className="text-sm text-surface-400">
            Catat penjualan, pembelian, atau pengeluaran
          </p>
        </div>
      </div>
      <TransactionForm
        products={products || []}
        customers={customers || []}
        userId={user.id}
      />
    </div>
  );
}
