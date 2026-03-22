import { createServerClient } from "@/lib/supabase-server";
import { formatCurrency, formatDate } from "@/utils";
import type { Database } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  CreditCard,
} from "lucide-react";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { MonthlyBarChart } from "@/components/reports/MonthlyBarChart";
import { MonthSelector } from "./MonthSelector";

export const revalidate = 0;

async function getReportData(userId: string, month?: string) {
  const supabase = createServerClient();

  const now = new Date();
  const year = now.getFullYear();
  const selectedMonth = month ? parseInt(month) - 1 : now.getMonth();

  const startOfMonth = new Date(year, selectedMonth, 1);
  const endOfMonth = new Date(year, selectedMonth + 1, 0, 23, 59, 59);

  // Monthly transactions
  const { data: monthTxns } = await supabase
    .from("transactions")
    .select("total_amount, type, created_at, payment_method")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("created_at", startOfMonth.toISOString())
    .lte("created_at", endOfMonth.toISOString());

  const typedMonthTxns = monthTxns as Pick<
    Database["public"]["Tables"]["transactions"]["Row"],
    "total_amount" | "type" | "created_at" | "payment_method"
  >[];

  const revenue =
    typedMonthTxns
      ?.filter((t) => t.type === "sale")
      .reduce((s, t) => s + t.total_amount, 0) || 0;
  const expense =
    typedMonthTxns
      ?.filter((t) => t.type !== "sale")
      .reduce((s, t) => s + t.total_amount, 0) || 0;
  const profit = revenue - expense;
  const txnCount = monthTxns?.length || 0;

  // Daily breakdown for current month
  const dailyData: { date: string; revenue: number; expense: number }[] = [];
  const daysInMonth = endOfMonth.getDate();
  for (
    let d = 1;
    d <=
    Math.min(
      daysInMonth,
      now.getDate() + (selectedMonth < now.getMonth() ? 999 : 0)
    );
    d++
  ) {
    const dayStr = `${String(d).padStart(2, "0")}`;
    const dayTxns =
      typedMonthTxns?.filter((t) => new Date(t.created_at).getDate() === d) ||
      [];
    dailyData.push({
      date: dayStr,
      revenue: dayTxns
        .filter((t) => t.type === "sale")
        .reduce((s, t) => s + t.total_amount, 0),
      expense: dayTxns
        .filter((t) => t.type !== "sale")
        .reduce((s, t) => s + t.total_amount, 0),
    });
  }

  // Monthly totals for last 6 months
  const monthlyTotals: { month: string; revenue: number; expense: number }[] =
    [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, now.getMonth() - i, 1);
    const end = new Date(year, now.getMonth() - i + 1, 0, 23, 59, 59);
    const { data: mTxns } = await supabase
      .from("transactions")
      .select("total_amount, type")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("created_at", d.toISOString())
      .lte("created_at", end.toISOString());
    const typedMTxns = mTxns as Pick<
      Database["public"]["Tables"]["transactions"]["Row"],
      "total_amount" | "type"
    >[];
    monthlyTotals.push({
      month: d.toLocaleDateString("id-ID", { month: "short" }),
      revenue:
        typedMTxns
          ?.filter((t) => t.type === "sale")
          .reduce((s, t) => s + t.total_amount, 0) || 0,
      expense:
        typedMTxns
          ?.filter((t) => t.type !== "sale")
          .reduce((s, t) => s + t.total_amount, 0) || 0,
    });
  }

  // Payment method breakdown
  const paymentBreakdown = {
    cash:
      typedMonthTxns
        ?.filter((t) => t.payment_method === "cash")
        .reduce((s, t) => s + t.total_amount, 0) || 0,
    transfer:
      typedMonthTxns
        ?.filter((t) => t.payment_method === "transfer")
        .reduce((s, t) => s + t.total_amount, 0) || 0,
    debt:
      typedMonthTxns
        ?.filter((t) => t.payment_method === "debt")
        .reduce((s, t) => s + t.total_amount, 0) || 0,
  };

  // Top selling products (all time)
  const { data: topItems } = await supabase
    .from("transaction_items")
    .select("product:products(name), quantity, subtotal")
    .limit(100);

  // Total debts
  const { data: debts } = await supabase
    .from("debts")
    .select("remaining_amount")
    .eq("user_id", userId)
    .in("status", ["unpaid", "partial"]);
  const typedDebts = debts as Pick<
    Database["public"]["Tables"]["debts"]["Row"],
    "remaining_amount"
  >[];
  const totalDebt =
    typedDebts?.reduce((s, d) => s + d.remaining_amount, 0) || 0;

  return {
    revenue,
    expense,
    profit,
    txnCount,
    dailyData,
    monthlyTotals,
    paymentBreakdown,
    totalDebt,
    selectedMonth: selectedMonth + 1,
  };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const data = await getReportData(user.id, searchParams.month);

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const summaryCards = [
    {
      label: "Total Pendapatan",
      value: formatCurrency(data.revenue),
      icon: TrendingUp,
      color: "bg-green-50 text-green-600",
      valueColor: "text-green-600",
    },
    {
      label: "Total Pengeluaran",
      value: formatCurrency(data.expense),
      icon: TrendingDown,
      color: "bg-red-50 text-red-500",
      valueColor: "text-red-500",
    },
    {
      label: "Keuntungan Bersih",
      value: formatCurrency(data.profit),
      icon: data.profit >= 0 ? ArrowUpRight : ArrowDownRight,
      color:
        data.profit >= 0
          ? "bg-blue-50 text-blue-600"
          : "bg-orange-50 text-orange-500",
      valueColor: data.profit >= 0 ? "text-blue-600" : "text-orange-500",
    },
    {
      label: "Total Hutang",
      value: formatCurrency(data.totalDebt),
      icon: CreditCard,
      color: "bg-amber-50 text-amber-600",
      valueColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Keuangan</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Analisis kinerja warung Anda
          </p>
        </div>
        <MonthSelector selectedMonth={data.selectedMonth} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className={`stat-icon ${card.color}`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-surface-500">{card.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${card.valueColor}`}>
                {card.value}
              </p>
              <p className="text-xs text-surface-400">
                {months[data.selectedMonth - 1]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5">
        {/* Daily chart */}
        <div className="col-span-2 card p-5">
          <h3 className="font-semibold text-surface-800 text-sm mb-1">
            Grafik Harian
          </h3>
          <p className="text-xs text-surface-400 mb-4">
            {months[data.selectedMonth - 1]} — per hari
          </p>
          <RevenueChart data={data.dailyData} />
        </div>

        {/* Payment method breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold text-surface-800 text-sm mb-4">
            Metode Pembayaran
          </h3>
          <div className="space-y-4">
            {[
              {
                label: "Tunai",
                value: data.paymentBreakdown.cash,
                color: "bg-green-500",
              },
              {
                label: "Transfer",
                value: data.paymentBreakdown.transfer,
                color: "bg-blue-500",
              },
              {
                label: "Hutang",
                value: data.paymentBreakdown.debt,
                color: "bg-amber-500",
              },
            ].map((item) => {
              const total =
                data.paymentBreakdown.cash +
                data.paymentBreakdown.transfer +
                data.paymentBreakdown.debt;
              const pct =
                total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-surface-600">
                      {item.label}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-surface-800">
                        {pct}%
                      </span>
                      <span className="text-xs text-surface-400 ml-1">
                        ({formatCurrency(item.value)})
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-surface-100">
            <p className="text-xs text-surface-500 mb-3">Ringkasan Bulan Ini</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Jumlah Transaksi</span>
                <span className="font-semibold text-surface-800">
                  {data.txnCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Rata-rata/Transaksi</span>
                <span className="font-semibold text-surface-800">
                  {data.txnCount > 0
                    ? formatCurrency(data.revenue / data.txnCount)
                    : "Rp 0"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="card p-5">
        <h3 className="font-semibold text-surface-800 text-sm mb-1">
          Tren 6 Bulan Terakhir
        </h3>
        <p className="text-xs text-surface-400 mb-4">
          Perbandingan pendapatan dan pengeluaran
        </p>
        <MonthlyBarChart data={data.monthlyTotals} />
      </div>
    </div>
  );
}
