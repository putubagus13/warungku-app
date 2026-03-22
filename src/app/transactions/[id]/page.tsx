import { createServerClient } from "@/lib/supabase-server";
import {
  formatCurrency,
  formatDateTime,
  getTransactionTypeLabel,
  getPaymentMethodLabel,
} from "@/utils";
import { ArrowLeft, Receipt } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/utils";
import { Transaction } from "@/types";

export default async function TransactionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: txn } = (await supabase
    .from("transactions")
    .select(
      `
      *,
      customer:customers(name, phone),
      items:transaction_items(*, product:products(name, unit, sku))
    `
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()) as { data: Transaction };

  if (!txn) return notFound();

  const isSale = txn.type === "sale";

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/transactions" className="btn-ghost btn-sm p-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="page-title">Detail Transaksi</h1>
          <p className="text-xs text-surface-400 font-mono mt-0.5">
            {txn.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Header */}
        <div
          className={cn("px-6 py-4", isSale ? "bg-primary-50" : "bg-red-50")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isSale ? "bg-primary-600" : "bg-red-500"
                )}
              >
                <Receipt size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-surface-800">
                  {getTransactionTypeLabel(txn.type)}
                </p>
                <p className="text-xs text-surface-500">
                  {formatDateTime(txn.created_at)}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "badge",
                txn.status === "completed"
                  ? "text-green-600 bg-green-50 border-green-200"
                  : "text-gray-500 bg-gray-50 border-gray-200"
              )}
            >
              {txn.status === "completed" ? "Selesai" : txn.status}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 py-4 border-b border-surface-100 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-surface-400 mb-0.5">Pelanggan</p>
            <p className="text-sm font-medium text-surface-800">
              {txn.customer?.name || "Umum"}
            </p>
          </div>
          <div>
            <p className="text-xs text-surface-400 mb-0.5">Metode Pembayaran</p>
            <p className="text-sm font-medium text-surface-800">
              {getPaymentMethodLabel(txn.payment_method)}
            </p>
          </div>
          {txn.notes && (
            <div className="col-span-2">
              <p className="text-xs text-surface-400 mb-0.5">Catatan</p>
              <p className="text-sm text-surface-700">{txn.notes}</p>
            </div>
          )}
        </div>

        {/* Items */}
        {(txn?.items?.length || 0) > 0 && (
          <div className="px-6 py-4 border-b border-surface-100">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">
              Item
            </p>
            <div className="space-y-3">
              {(txn?.items || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-surface-800">
                      {item.product?.name}
                    </p>
                    <p className="text-xs text-surface-400">
                      {item.quantity} {item.product?.unit} ×{" "}
                      {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-surface-800">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="px-6 py-4 bg-surface-50">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-surface-700">Total</span>
            <span
              className={cn(
                "text-xl font-bold",
                isSale ? "text-primary-600" : "text-red-500"
              )}
            >
              {isSale ? "+" : "-"}
              {formatCurrency(txn.total_amount)}
            </span>
          </div>
          {txn.payment_method === "debt" && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-surface-400">Terbayar</span>
              <span className="text-xs text-surface-500">
                {formatCurrency(txn.paid_amount)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
