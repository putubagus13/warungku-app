import { createServerClient } from "@/lib/supabase-server";
import { formatCurrency, formatNumber, calculateMargin } from "@/utils";
import { Package, Plus, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils";
import { EmptyState } from "@/components/ui";
import { ProductActions } from "@/components/products/ProductActions";

export const revalidate = 0;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string; filter?: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("products")
    .select("*, category:categories(id, name, color)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`);
  }
  if (searchParams.category) {
    query = query.eq("category_id", searchParams.category);
  }

  const { data: products } = await query;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, color")
    .eq("user_id", user.id)
    .order("name");

  const filtered =
    searchParams.filter === "low-stock"
      ? products?.filter((p: any) => p.stock <= p.min_stock)
      : products;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Produk</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            {filtered?.length || 0} produk ditemukan
          </p>
        </div>
        <Link href="/products/new" className="btn-primary">
          <Plus size={16} />
          Tambah Produk
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <form method="GET" className="flex-1 max-w-xs">
          <input
            name="search"
            defaultValue={searchParams.search}
            placeholder="Cari produk..."
            className="input"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/products"
            className={cn(
              "badge cursor-pointer",
              !searchParams.category && !searchParams.filter
                ? "bg-primary-600 text-white border-primary-600"
                : "hover:border-primary-400"
            )}
          >
            Semua
          </Link>
          <Link
            href="/products?filter=low-stock"
            className={cn(
              "badge cursor-pointer text-orange-600 bg-orange-50 border-orange-200",
              searchParams.filter === "low-stock" && "ring-1 ring-orange-400"
            )}
          >
            <AlertTriangle size={10} /> Stok Rendah
          </Link>
          {categories?.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className={cn(
                "badge cursor-pointer",
                searchParams.category === cat.id
                  ? "bg-primary-600 text-white border-primary-600"
                  : "hover:border-primary-400"
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      {!filtered?.length ? (
        <div className="card">
          <EmptyState
            icon={<Package size={24} />}
            title="Belum ada produk"
            description="Tambahkan produk pertama Anda untuk mulai berjualan"
            action={
              <Link href="/products/new" className="btn-primary btn-sm">
                <Plus size={14} /> Tambah Produk
              </Link>
            }
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Harga Jual</th>
                <th>Harga Beli</th>
                <th>Margin</th>
                <th>Stok</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product: any) => {
                const isLowStock = product.stock <= product.min_stock;
                const margin = calculateMargin(
                  product.price,
                  product.cost_price
                );
                return (
                  <tr key={product.id}>
                    <td>
                      <div>
                        <p className="font-medium text-surface-800">
                          {product.name}
                        </p>
                        {product.sku && (
                          <p className="text-xs text-surface-400 font-mono mt-0.5">
                            {product.sku}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      {product.category ? (
                        <span
                          className="badge"
                          style={{
                            color: product.category.color,
                            backgroundColor: product.category.color + "15",
                            borderColor: product.category.color + "40",
                          }}
                        >
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-surface-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="font-medium text-surface-800">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="text-surface-500">
                      {formatCurrency(product.cost_price)}
                    </td>
                    <td>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          margin >= 30
                            ? "text-green-600"
                            : margin >= 10
                            ? "text-yellow-600"
                            : "text-red-500"
                        )}
                      >
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "font-semibold text-sm",
                            isLowStock ? "text-orange-500" : "text-surface-800"
                          )}
                        >
                          {formatNumber(product.stock)}
                        </span>
                        <span className="text-xs text-surface-400">
                          {product.unit}
                        </span>
                        {isLowStock && (
                          <AlertTriangle
                            size={13}
                            className="text-orange-500"
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      <ProductActions product={product} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
