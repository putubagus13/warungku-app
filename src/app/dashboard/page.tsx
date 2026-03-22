import { createServerClient } from "@/lib/supabase-server";
import { formatCurrency, formatRelative } from "@/utils";
import type { Transaction } from "@/types";
import {
  TrendingUp,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Users,
} from "lucide-react";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import Link from "next/link";
import { cn } from "@/utils";

export const revalidate = 60;

async function getDashboardData(userId: string) {
  const supabase = createServerClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  // Today revenue
  const { data: todayTxns } = (await supabase
    .from("transactions")
    .select("total_amount, type")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("created_at", todayStr)) as {
    data: Pick<Transaction, "total_amount" | "type">[] | null;
  };

  const todayRevenue =
    todayTxns
      ?.filter((t) => t.type === "sale")
      .reduce((s, t) => s + t.total_amount, 0) || 0;
  const todayExpense =
    todayTxns
      ?.filter((t) => t.type !== "sale")
      .reduce((s, t) => s + t.total_amount, 0) || 0;
  const todayTransactions = todayTxns?.length || 0;

  // Total debt
  const { data: debts } = await supabase
    .from("debts")
    .select("remaining_amount")
    .eq("user_id", userId)
    .in("status", ["unpaid", "partial"]);
  const totalDebt =
    debts?.reduce((s, d: any) => s + d.remaining_amount, 0) || 0;

  // Low stock products
  const { count: lowStockCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true)
    .filter("stock", "lte", "min_stock");

  // 7-day daily revenue
  const dailyRevenue: { date: string; revenue: number; expense: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    const { data: dayTxns } = (await supabase
      .from("transactions")
      .select("total_amount, type")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())) as {
      data: Pick<Transaction, "total_amount" | "type">[] | null;
    };
    dailyRevenue.push({
      date: d.toLocaleDateString("id-ID", { weekday: "short" }),
      revenue:
        dayTxns
          ?.filter((t) => t.type === "sale")
          .reduce((s, t) => s + t.total_amount, 0) || 0,
      expense:
        dayTxns
          ?.filter((t) => t.type !== "sale")
          .reduce((s, t) => s + t.total_amount, 0) || 0,
    });
  }

  // Recent transactions
  const { data: recentTxns } = await supabase
    .from("transactions")
    .select("*, customer:customers(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  // TOP PRODUCTS — dari transaction_items 30 hari terakhir
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: saleItems } = await supabase
    .from("transaction_items")
    .select(
      `
      quantity, subtotal,
      product:products(name, category_id),
      transaction:transactions!inner(type, created_at, user_id)
    `
    )
    .eq("transaction.user_id", userId)
    .eq("transaction.type", "sale")
    .gte("transaction.created_at", thirtyDaysAgo.toISOString());

  // Aggregate by product
  const productMap: Record<
    string,
    { name: string; total: number; qty: number; category_id: string | null }
  > = {};
  saleItems?.forEach((item: any) => {
    const name = item.product?.name || "Unknown";
    if (!productMap[name])
      productMap[name] = {
        name,
        total: 0,
        qty: 0,
        category_id: item.product?.category_id,
      };
    productMap[name].total += item.subtotal;
    productMap[name].qty += item.quantity;
  });
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Aggregate by category
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId);
  const catMap: Record<string, { name: string; total: number; qty: number }> =
    {};
  saleItems?.forEach((item: any) => {
    const catId = item.product?.category_id;
    const catName =
      (categories as any[])?.find((c: any) => c.id === catId)?.name ||
      "Tanpa Kategori";
    if (!catMap[catName]) catMap[catName] = { name: catName, total: 0, qty: 0 };
    catMap[catName].total += item.subtotal;
    catMap[catName].qty += item.quantity;
  });
  const topCategories = Object.values(catMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Counts
  const { count: productCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);
  const { count: customerCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  return {
    todayRevenue,
    todayExpense,
    todayTransactions,
    totalDebt,
    lowStockCount: lowStockCount || 0,
    dailyRevenue,
    recentTxns: recentTxns || [],
    topProducts,
    topCategories,
    productCount: productCount || 0,
    customerCount: customerCount || 0,
  };
}

export default async function DashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const data = await getDashboardData(user.id);
  const firstName = user.user_metadata?.full_name?.split(" ")[0] || "Admin";

  const stats = [
    {
      label: "Pendapatan Hari Ini",
      value: formatCurrency(data.todayRevenue),
      icon: TrendingUp,
      color: "bg-primary-50 text-primary-600",
      sub: `${data.todayTransactions} transaksi`,
      href: "/transactions",
    },
    {
      label: "Pengeluaran Hari Ini",
      value: formatCurrency(data.todayExpense),
      icon: ArrowDownRight,
      color: "bg-red-50 text-red-500",
      sub: "pembelian + biaya",
      href: "/transactions?type=expense",
    },
    {
      label: "Total Hutang Pelanggan",
      value: formatCurrency(data.totalDebt),
      icon: CreditCard,
      color: "bg-amber-50 text-amber-600",
      sub: "belum terlunasi",
      href: "/debts",
    },
    {
      label: "Stok Hampir Habis",
      value: String(data.lowStockCount),
      icon: AlertTriangle,
      color: "bg-orange-50 text-orange-500",
      sub: "produk perlu restock",
      href: "/products?filter=low-stock",
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-surface-900">
          Selamat datang, {firstName} 👋
        </h1>
        <p className="text-surface-500 text-sm mt-0.5">
          Berikut ringkasan warung Anda hari ini
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="stat-card hover:border-primary-200 cursor-pointer transition-all group"
          >
            <div className={cn("stat-icon", s.color)}>
              <s.icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-surface-500 truncate">{s.label}</p>
              <p className="text-lg font-bold text-surface-900 mt-0.5 truncate">
                {s.value}
              </p>
              <p className="text-xs text-surface-400 mt-0.5">{s.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick counts */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/products"
          className="card p-4 flex items-center gap-3 hover:border-primary-200 transition-all"
        >
          <div className="stat-icon bg-blue-50 text-blue-600">
            <Package size={18} />
          </div>
          <div>
            <p className="text-xs text-surface-500">Total Produk Aktif</p>
            <p className="text-xl font-bold text-surface-900">
              {data.productCount}
            </p>
          </div>
          <span className="ml-auto text-xs text-primary-600">Kelola →</span>
        </Link>
        <Link
          href="/customers"
          className="card p-4 flex items-center gap-3 hover:border-primary-200 transition-all"
        >
          <div className="stat-icon bg-violet-50 text-violet-600">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs text-surface-500">Total Pelanggan</p>
            <p className="text-xl font-bold text-surface-900">
              {data.customerCount}
            </p>
          </div>
          <span className="ml-auto text-xs text-primary-600">Kelola →</span>
        </Link>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-4">
        {/* Revenue chart */}
        <div className="col-span-3 card p-5">
          <h3 className="font-semibold text-surface-800 text-sm mb-1">
            Pendapatan vs Pengeluaran
          </h3>
          <p className="text-xs text-surface-400 mb-4">7 hari terakhir</p>
          <RevenueChart data={data.dailyRevenue} />
        </div>

        {/* Recent transactions */}
        <div className="col-span-2 card p-5">
          <h3 className="font-semibold text-surface-800 text-sm mb-1">
            Transaksi Terbaru
          </h3>
          <p className="text-xs text-surface-400 mb-4">5 transaksi terakhir</p>
          <div className="space-y-3">
            {data.recentTxns.length === 0 ? (
              <p className="text-xs text-surface-400 text-center py-4">
                Belum ada transaksi
              </p>
            ) : (
              data.recentTxns.map((txn: any) => (
                <div key={txn.id} className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0",
                      txn.type === "sale"
                        ? "bg-primary-50 text-primary-600"
                        : "bg-red-50 text-red-500"
                    )}
                  >
                    {txn.type === "sale" ? (
                      <ArrowUpRight size={13} />
                    ) : (
                      <ArrowDownRight size={13} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-800 truncate">
                      {txn.customer?.name || "Umum"}
                    </p>
                    <p className="text-[10px] text-surface-400">
                      {formatRelative(txn.created_at)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      txn.type === "sale" ? "text-primary-600" : "text-red-500"
                    )}
                  >
                    {txn.type === "sale" ? "+" : "-"}
                    {formatCurrency(txn.total_amount)}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link
            href="/transactions"
            className="block text-center text-xs text-primary-600 hover:underline mt-4"
          >
            Lihat semua →
          </Link>
        </div>
      </div>

      {/* Top products & categories */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-surface-800 text-sm">
            Produk & Kategori Terlaris
          </h3>
          <Link
            href="/reports"
            className="text-xs text-primary-600 hover:underline"
          >
            Laporan lengkap →
          </Link>
        </div>
        <p className="text-xs text-surface-400 mb-4">
          30 hari terakhir berdasarkan pendapatan
        </p>
        <TopProductsChart
          products={data.topProducts}
          categories={data.topCategories}
        />
      </div>
    </div>
  );
}
