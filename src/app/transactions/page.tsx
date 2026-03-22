import { createServerClient } from "@/lib/supabase-server";
import {
  formatCurrency,
  formatDateTime,
  getTransactionTypeLabel,
  getPaymentMethodLabel,
} from "@/utils";
import { ShoppingCart, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils";
import { EmptyState } from "@/components/ui";
import { Transaction } from "@/types";

export const revalidate = 0;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { type?: string; date_from?: string; date_to?: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("transactions")
    .select("*, customer:customers(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (searchParams.type) query = query.eq("type", searchParams.type);
  if (searchParams.date_from)
    query = query.gte("created_at", searchParams.date_from);
  if (searchParams.date_to)
    query = query.lte("created_at", searchParams.date_to + "T23:59:59");

  const { data: transactions } = (await query) as { data: Transaction[] };

  const totalIn =
    transactions
      ?.filter((t) => t.type === "sale")
      .reduce((s: number, t) => s + t.total_amount, 0) || 0;
  const totalOut =
    transactions
      ?.filter((t) => t.type !== "sale")
      .reduce((s: number, t) => s + t.total_amount, 0) || 0;

  const typeFilters = [
    { label: "Semua", value: "" },
    { label: "Penjualan", value: "sale" },
    { label: "Pembelian", value: "purchase" },
    { label: "Pengeluaran", value: "expense" },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaksi</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            {transactions?.length || 0} transaksi
          </p>
        </div>
        <Link href="/transactions/new" className="btn-primary">
          <Plus size={16} /> Transaksi Baru
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="stat-icon bg-green-50 text-green-600">
            <ArrowUpRight size={18} />
          </div>
          <div>
            <p className="text-xs text-surface-500">Total Uang Masuk</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(totalIn)}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="stat-icon bg-red-50 text-red-500">
            <ArrowDownRight size={18} />
          </div>
          <div>
            <p className="text-xs text-surface-500">Total Uang Keluar</p>
            <p className="text-lg font-bold text-red-500">
              {formatCurrency(totalOut)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-2">
          {typeFilters.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/transactions?type=${f.value}` : "/transactions"}
              className={cn(
                "badge cursor-pointer text-xs",
                searchParams.type === f.value ||
                  (!searchParams.type && !f.value)
                  ? "bg-primary-600 text-white border-primary-600"
                  : "hover:border-primary-300"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-2 ml-auto items-center">
          <form method="GET" className="flex gap-2 items-center">
            {searchParams.type && (
              <input type="hidden" name="type" value={searchParams.type} />
            )}
            <input
              type="date"
              name="date_from"
              defaultValue={searchParams.date_from}
              className="input text-xs py-1.5"
            />
            <span className="text-surface-400 text-xs">s/d</span>
            <input
              type="date"
              name="date_to"
              defaultValue={searchParams.date_to}
              className="input text-xs py-1.5"
            />
            <button type="submit" className="btn-secondary btn-sm">
              Filter
            </button>
          </form>
        </div>
      </div>

      {!transactions?.length ? (
        <div className="card">
          <EmptyState
            icon={<ShoppingCart size={24} />}
            title="Belum ada transaksi"
            description="Catat transaksi penjualan, pembelian, dan pengeluaran Anda"
            action={
              <Link href="/transactions/new" className="btn-primary btn-sm">
                <Plus size={14} /> Buat Transaksi
              </Link>
            }
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Jenis</th>
                <th>Pelanggan</th>
                <th>Pembayaran</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id}>
                  <td className="text-xs text-surface-500 whitespace-nowrap">
                    {formatDateTime(txn.created_at)}
                  </td>
                  <td>
                    <span
                      className={cn(
                        "badge text-xs",
                        txn.type === "sale"
                          ? "text-green-700 bg-green-50 border-green-200"
                          : txn.type === "purchase"
                          ? "text-blue-700 bg-blue-50 border-blue-200"
                          : "text-orange-700 bg-orange-50 border-orange-200"
                      )}
                    >
                      {getTransactionTypeLabel(txn.type)}
                    </span>
                  </td>
                  <td className="text-sm text-surface-700">
                    {(txn.customer as any)?.name || (
                      <span className="text-surface-400">Umum</span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-surface-500">
                      {getPaymentMethodLabel(txn.payment_method)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={cn(
                        "font-semibold text-sm",
                        txn.type === "sale" ? "text-green-600" : "text-red-500"
                      )}
                    >
                      {txn.type === "sale" ? "+" : "-"}
                      {formatCurrency(txn.total_amount)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={cn(
                        "badge text-xs",
                        txn.status === "completed"
                          ? "text-green-700 bg-green-50 border-green-200"
                          : txn.status === "pending"
                          ? "text-yellow-700 bg-yellow-50 border-yellow-200"
                          : "text-red-700 bg-red-50 border-red-200"
                      )}
                    >
                      {txn.status === "completed"
                        ? "Selesai"
                        : txn.status === "pending"
                        ? "Pending"
                        : "Dibatalkan"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
