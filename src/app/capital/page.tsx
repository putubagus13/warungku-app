import { createServerClient } from "@/lib/supabase-server";
import { formatCurrency, formatDate } from "@/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  BarChart3,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { cn } from "@/utils";
import { CapitalManager } from "@/components/capital/CapitalManager";
import { CapitalCharts } from "@/components/capital/CapitalCharts";
import type { CapitalEntry, Transaction, Product } from "@/types";

export const revalidate = 0;

async function getCapitalData(userId: string) {
  const supabase = createServerClient();

  // All capital entries
  const { data: entries } = (await supabase
    .from("capital_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })) as { data: CapitalEntry[] };

  // All transactions for revenue/expense
  const { data: transactions } = (await supabase
    .from("transactions")
    .select("total_amount, type")
    .eq("user_id", userId)
    .eq("status", "completed")) as {
    data: Pick<Transaction, "total_amount" | "type">[];
  };

  // Stock value estimate
  const { data: products } = (await supabase
    .from("products")
    .select("stock, cost_price")
    .eq("user_id", userId)
    .eq("is_active", true)) as {
    data: Pick<Product, "stock" | "cost_price">[];
  };

  const totalRevenue = (transactions || [])
    .filter((t) => t.type === "sale")
    .reduce((s, t) => s + t.total_amount, 0);

  const totalExpense = (transactions || [])
    .filter((t) => t.type !== "sale")
    .reduce((s, t) => s + t.total_amount, 0);

  const capitalEntries = entries || [];

  const totalModal = capitalEntries
    .filter((e) => ["initial", "addition"].includes(e.type))
    .reduce((s, e) => s + e.amount, 0);

  const totalInvestor = capitalEntries
    .filter((e) => e.type === "investor")
    .reduce((s, e) => s + e.amount, 0);

  const totalLoan = capitalEntries
    .filter((e) => e.type === "loan" && !e.loan_paid)
    .reduce((s, e) => s + e.amount, 0);

  const totalWithdrawal = capitalEntries
    .filter((e) => e.type === "withdrawal")
    .reduce((s, e) => s + e.amount, 0);

  const totalCapitalIn = totalModal + totalInvestor + totalLoan;

  const stockValue = (products || []).reduce(
    (s, p) => s + p.stock * p.cost_price,
    0
  );

  const cashBalance =
    totalCapitalIn + totalRevenue - totalExpense - totalWithdrawal;

  const netWorth = cashBalance + stockValue - totalLoan;

  const roi =
    totalCapitalIn > 0
      ? ((netWorth - totalCapitalIn) / totalCapitalIn) * 100
      : 0;

  // Monthly capital trend (last 6 months)
  const monthlyTrend: { month: string; capital: number; netWorth: number }[] =
    [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthEntries = capitalEntries.filter((e) => {
      const ed = new Date(e.date);
      return ed >= d && ed <= end;
    });
    const monthCapital = monthEntries
      .filter((e) => e.type !== "withdrawal")
      .reduce((s, e) => s + e.amount, 0);
    monthlyTrend.push({
      month: d.toLocaleDateString("id-ID", { month: "short" }),
      capital: monthCapital,
      netWorth: netWorth,
    });
  }

  return {
    entries: capitalEntries as CapitalEntry[],
    totalModal,
    totalInvestor,
    totalLoan,
    totalWithdrawal,
    totalRevenue,
    totalExpense,
    stockValue,
    cashBalance,
    netWorth,
    roi,
    monthlyTrend,
  };
}

export default async function CapitalPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const data = await getCapitalData(user.id);

  const summaryCards = [
    {
      label: "Total Modal Disetor",
      value: formatCurrency(data.totalModal + data.totalInvestor),
      icon: PiggyBank,
      color: "bg-blue-50 text-blue-600",
      valueColor: "text-blue-700",
      sub:
        `${data.totalModal > 0 ? "Modal sendiri + " : ""}${
          data.totalInvestor > 0 ? "Investor" : ""
        }`
          .replace(/^\+/, "")
          .trim() || "Belum ada modal",
    },
    {
      label: "Total Pinjaman Aktif",
      value: formatCurrency(data.totalLoan),
      icon: Building2,
      color: "bg-orange-50 text-orange-600",
      valueColor: data.totalLoan > 0 ? "text-orange-600" : "text-surface-400",
      sub: data.totalLoan > 0 ? "Perlu dilunasi" : "Tidak ada pinjaman",
    },
    {
      label: "Saldo Kas Bersih",
      value: formatCurrency(data.cashBalance),
      icon: Wallet,
      color:
        data.cashBalance >= 0
          ? "bg-green-50 text-green-600"
          : "bg-red-50 text-red-500",
      valueColor: data.cashBalance >= 0 ? "text-green-600" : "text-red-500",
      sub: "Modal + Pendapatan − Pengeluaran",
    },
    {
      label: "Aset Bersih (Net Worth)",
      value: formatCurrency(data.netWorth),
      icon: BarChart3,
      color:
        data.netWorth >= 0
          ? "bg-primary-50 text-primary-600"
          : "bg-red-50 text-red-500",
      valueColor: data.netWorth >= 0 ? "text-primary-600" : "text-red-500",
      sub: `ROI: ${data.roi >= 0 ? "+" : ""}${data.roi.toFixed(1)}%`,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Modal & Investasi</h1>
        <p className="text-surface-400 text-sm mt-0.5">
          Kelola sumber modal, pinjaman, dan pantau kesehatan keuangan warung
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className={cn("stat-icon", card.color)}>
              <card.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-surface-500 truncate">{card.label}</p>
              <p className={cn("text-lg font-bold mt-0.5", card.valueColor)}>
                {card.value}
              </p>
              <p className="text-xs text-surface-400 mt-0.5 truncate">
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Neraca sederhana */}
      <div className="grid grid-cols-3 gap-4">
        {/* Aset */}
        <div className="card p-5">
          <h3 className="font-semibold text-surface-800 text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-green-600" /> Aset
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-surface-500">Kas & Bank</span>
              <span className="font-semibold text-surface-800">
                {formatCurrency(Math.max(data.cashBalance, 0))}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-surface-500">Nilai Stok</span>
              <span className="font-semibold text-surface-800">
                {formatCurrency(data.stockValue)}
              </span>
            </div>
            <div className="border-t border-surface-100 pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-surface-700">
                Total Aset
              </span>
              <span className="font-bold text-green-600">
                {formatCurrency(
                  Math.max(data.cashBalance, 0) + data.stockValue
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Kewajiban */}
        <div className="card p-5">
          <h3 className="font-semibold text-surface-800 text-sm mb-4 flex items-center gap-2">
            <TrendingDown size={15} className="text-red-500" /> Kewajiban
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-surface-500">Pinjaman aktif</span>
              <span className="font-semibold text-surface-800">
                {formatCurrency(data.totalLoan)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-surface-500">Penarikan modal</span>
              <span className="font-semibold text-surface-800">
                {formatCurrency(data.totalWithdrawal)}
              </span>
            </div>
            <div className="border-t border-surface-100 pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-surface-700">
                Total Kewajiban
              </span>
              <span className="font-bold text-red-500">
                {formatCurrency(data.totalLoan + data.totalWithdrawal)}
              </span>
            </div>
          </div>
        </div>

        {/* Ekuitas */}
        <div className="card p-5 border-primary-200 bg-primary-50/30">
          <h3 className="font-semibold text-surface-800 text-sm mb-4 flex items-center gap-2">
            <PiggyBank size={15} className="text-primary-600" /> Ekuitas (Modal
            Bersih)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-surface-500">Modal disetor</span>
              <span className="font-semibold text-surface-800">
                {formatCurrency(data.totalModal + data.totalInvestor)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-surface-500">Laba ditahan</span>
              <span
                className={cn(
                  "font-semibold",
                  data.totalRevenue - data.totalExpense >= 0
                    ? "text-green-600"
                    : "text-red-500"
                )}
              >
                {formatCurrency(data.totalRevenue - data.totalExpense)}
              </span>
            </div>
            <div className="border-t border-primary-200 pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-surface-700">
                Total Ekuitas
              </span>
              <span
                className={cn(
                  "font-bold text-lg",
                  data.netWorth >= 0 ? "text-primary-600" : "text-red-500"
                )}
              >
                {formatCurrency(data.netWorth)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts + entries */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 card p-5">
          <h3 className="font-semibold text-surface-800 text-sm mb-4">
            Komposisi Modal
          </h3>
          <CapitalCharts
            data={{
              modal: data.totalModal,
              investor: data.totalInvestor,
              loan: data.totalLoan,
              revenue: data.totalRevenue,
              expense: data.totalExpense,
            }}
          />
        </div>

        {/* Pinjaman aktif */}
        <div className="col-span-3 card p-5">
          <h3 className="font-semibold text-surface-800 text-sm mb-4 flex items-center gap-2">
            Pinjaman Aktif
            {data.totalLoan > 0 && (
              <span className="badge text-orange-600 bg-orange-50 border-orange-200 ml-auto">
                {formatCurrency(data.totalLoan)}
              </span>
            )}
          </h3>
          {data.entries.filter((e) => e.type === "loan" && !e.loan_paid)
            .length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-surface-400">
              <CheckCircle2 size={28} className="mb-2 text-green-400" />
              <p className="text-sm font-medium text-green-600">
                Tidak ada pinjaman aktif
              </p>
              <p className="text-xs text-surface-400 mt-1">
                Warung bebas hutang!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.entries
                .filter((e) => e.type === "loan" && !e.loan_paid)
                .map((entry) => {
                  const isOverdue =
                    entry.loan_due_date &&
                    new Date(entry.loan_due_date) < new Date();
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm shrink-0">
                        🤝
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-800 truncate">
                          {entry.source}
                        </p>
                        <p className="text-xs text-surface-400">
                          {entry.loan_due_date ? (
                            <span
                              className={cn(
                                isOverdue ? "text-red-500 font-medium" : ""
                              )}
                            >
                              {isOverdue && "⚠️ "}Jatuh tempo:{" "}
                              {formatDate(entry.loan_due_date)}
                            </span>
                          ) : (
                            "Tanpa jatuh tempo"
                          )}
                        </p>
                      </div>
                      <span className="font-bold text-orange-600 text-sm">
                        {formatCurrency(entry.amount)}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Capital entries manager */}
      <CapitalManager entries={data.entries} userId={user.id} />
    </div>
  );
}
