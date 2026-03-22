import { createServerClient } from "@/lib/supabase-server";
import {
  formatCurrency,
  formatDate,
  getDebtStatusLabel,
  getDebtStatusColor,
} from "@/utils";
import { CreditCard, Plus, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils";
import { EmptyState } from "@/components/ui";
import { DebtPaymentButton } from "@/components/debts/DebtPaymentButton";
import { Debt } from "@/types";

export const revalidate = 0;

export default async function DebtsPage({
  searchParams,
}: {
  searchParams: { status?: string; customer?: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("debts")
    .select("*, customer:customers(id, name, phone), payments:debt_payments(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (searchParams.status) query = query.eq("status", searchParams.status);
  else query = query.in("status", ["unpaid", "partial"]);

  if (searchParams.customer)
    query = query.eq("customer_id", searchParams.customer);

  const { data: debts } = (await query) as { data: Debt[] | null };

  const totalRemaining =
    debts?.reduce((s: number, d) => s + d.remaining_amount, 0) || 0;

  const statusFilters = [
    { label: "Belum Lunas", value: "" },
    { label: "Belum Bayar", value: "unpaid" },
    { label: "Sebagian", value: "partial" },
    { label: "Lunas", value: "paid" },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hutang Pelanggan</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            {debts?.length || 0} catatan hutang
          </p>
        </div>
        <Link href="/debts/new" className="btn-primary">
          <Plus size={16} /> Catat Hutang
        </Link>
      </div>

      {/* Summary */}
      <div className="card p-4 flex items-center gap-4 bg-amber-50 border-amber-200">
        <div className="stat-icon bg-amber-100 text-amber-600">
          <CreditCard size={18} />
        </div>
        <div>
          <p className="text-xs text-amber-700">Total Hutang Belum Lunas</p>
          <p className="text-xl font-bold text-amber-800">
            {formatCurrency(totalRemaining)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/debts?status=${f.value}` : "/debts"}
            className={cn(
              "badge cursor-pointer text-xs",
              searchParams.status === f.value ||
                (!searchParams.status && !f.value)
                ? "bg-primary-600 text-white border-primary-600"
                : "hover:border-primary-300"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {!debts?.length ? (
        <div className="card">
          <EmptyState
            icon={<CreditCard size={24} />}
            title="Tidak ada hutang"
            description="Tidak ada catatan hutang pada filter yang dipilih"
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Pelanggan</th>
                <th>Hutang Awal</th>
                <th>Sisa Hutang</th>
                <th>Status</th>
                <th>Jatuh Tempo</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((debt: any) => (
                <tr key={debt.id}>
                  <td>
                    <div>
                      <p className="font-medium text-surface-800">
                        {debt.customer?.name}
                      </p>
                      {debt.customer?.phone && (
                        <p className="text-xs text-surface-400">
                          {debt.customer.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="text-sm text-surface-600">
                    {formatCurrency(debt.original_amount)}
                  </td>
                  <td>
                    <span className="font-bold text-red-600">
                      {formatCurrency(debt.remaining_amount)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={cn(
                        "badge text-xs",
                        getDebtStatusColor(debt.status)
                      )}
                    >
                      {getDebtStatusLabel(debt.status)}
                    </span>
                  </td>
                  <td>
                    {debt.due_date ? (
                      <span
                        className={cn(
                          "text-xs",
                          new Date(debt.due_date) < new Date() &&
                            debt.status !== "paid"
                            ? "text-red-500 font-medium flex items-center gap-1"
                            : "text-surface-500"
                        )}
                      >
                        {new Date(debt.due_date) < new Date() &&
                          debt.status !== "paid" && <AlertTriangle size={11} />}
                        {formatDate(debt.due_date)}
                      </span>
                    ) : (
                      <span className="text-surface-300">—</span>
                    )}
                  </td>
                  <td className="text-xs text-surface-500 max-w-50 truncate">
                    {debt.notes || "—"}
                  </td>
                  <td>
                    {debt.status !== "paid" && (
                      <DebtPaymentButton debt={debt} />
                    )}
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
