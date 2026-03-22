"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatCurrency } from "@/utils";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import type {
  Product,
  Customer,
  CartItem,
  Database,
  Transaction,
} from "@/types";
import { cn } from "@/utils";

interface Props {
  products: Product[];
  customers: Pick<Customer, "id" | "name">[];
  userId: string;
}

export function TransactionForm({ products, customers, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [type, setType] = useState<"sale" | "purchase" | "expense">("sale");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "debt"
  >("cash");
  const [notes, setNotes] = useState("");
  // Expense-only fields
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseCategory, setExpenseCategory] = useState("Operasional");

  const EXPENSE_CATEGORIES = [
    "Operasional",
    "Listrik",
    "Sewa",
    "Gaji",
    "Transportasi",
    "Perawatan",
    "Lainnya",
  ];

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  // PERBAIKAN UTAMA: harga sesuai jenis transaksi
  // Penjualan → pakai harga jual (price)
  // Pembelian → pakai harga beli/modal (cost_price)
  const getDefaultPrice = (product: Product) =>
    type === "purchase" ? product.cost_price : product.price;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? {
                ...i,
                quantity: Math.min(
                  i.quantity + 1,
                  type === "sale" ? product.stock : 9999
                ),
              }
            : i
        );
      }
      return [
        ...prev,
        { product, quantity: 1, unit_price: getDefaultPrice(product) },
      ];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, quantity: i.quantity + delta }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const updatePrice = (productId: string, price: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, unit_price: price } : i
      )
    );
  };

  const removeItem = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.product.id !== productId));

  const cartTotal = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total = type === "expense" ? expenseAmount : cartTotal;

  // Hitung laba kotor untuk penjualan
  const grossProfit =
    type === "sale"
      ? cart.reduce(
          (s, i) => s + i.quantity * (i.unit_price - i.product.cost_price),
          0
        )
      : 0;

  const handleChangeType = (t: "sale" | "purchase" | "expense") => {
    setType(t);
    setCart([]); // reset cart karena harga berubah
    setPaymentMethod("cash");
  };

  const handleSubmit = async () => {
    if (type === "expense") {
      if (!expenseDesc.trim())
        return toast.error("Deskripsi pengeluaran wajib diisi");
      if (expenseAmount <= 0)
        return toast.error("Jumlah pengeluaran harus lebih dari 0");
    } else {
      if (cart.length === 0)
        return toast.error("Tambahkan produk ke keranjang");
    }
    if (paymentMethod === "debt" && !customerId)
      return toast.error("Pilih pelanggan untuk transaksi hutang");

    setLoading(true);
    try {
      const insertData = {
        user_id: userId,
        customer_id: customerId || null,
        type,
        status: "completed" as const,
        payment_method: paymentMethod,
        total_amount: total,
        paid_amount: paymentMethod === "debt" ? 0 : total,
        notes:
          type === "expense"
            ? `[${expenseCategory}] ${expenseDesc}${notes ? " — " + notes : ""}`
            : notes || null,
      };

      const { data: txn, error: txnErr } = (await supabase
        .from("transactions")
        .insert(insertData as any)
        .select()
        .single()) as { data: Pick<Transaction, "id"> | null; error: any };

      if (txnErr) throw txnErr;

      // Insert items hanya untuk penjualan & pembelian
      if (type !== "expense" && cart.length > 0) {
        const items = cart.map((i) => ({
          transaction_id: txn!.id,
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.quantity * i.unit_price,
        }));
        const { error: itemsErr } = await supabase
          .from("transaction_items")
          .insert(items as any);
        if (itemsErr) throw itemsErr;
      }

      // Buat hutang otomatis jika bayar hutang
      if (paymentMethod === "debt" && customerId) {
        const { error: debtErr } = await supabase.from("debts").insert({
          user_id: userId,
          customer_id: customerId,
          transaction_id: txn!.id,
          original_amount: total,
          remaining_amount: total,
          status: "unpaid",
        } as any);
        if (debtErr) throw debtErr;
      }

      toast.success("Transaksi berhasil dicatat!");
      router.push("/transactions");
      router.refresh();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-5 gap-4 h-[calc(100vh-160px)]">
      {/* KIRI: Produk / Form pengeluaran */}
      <div className="col-span-3 flex flex-col card overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          {/* Type selector */}
          <div className="flex gap-2 mb-3">
            {(
              [
                {
                  value: "sale",
                  label: "Penjualan",
                  color: "bg-green-600 text-white border-green-600",
                },
                {
                  value: "purchase",
                  label: "Pembelian",
                  color: "bg-blue-600 text-white border-blue-600",
                },
                {
                  value: "expense",
                  label: "Pengeluaran",
                  color: "bg-orange-500 text-white border-orange-500",
                },
              ] as const
            ).map((t) => (
              <button
                key={t.value}
                onClick={() => handleChangeType(t.value)}
                className={cn(
                  "badge cursor-pointer text-xs transition-all",
                  type === t.value ? t.color : "hover:border-surface-400"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Info harga untuk konteks */}
          {type !== "expense" && (
            <div
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg mb-3 flex items-center gap-2",
                type === "sale"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              )}
            >
              <span className="font-medium">
                {type === "sale"
                  ? "💰 Harga jual (sudah termasuk margin)"
                  : "🏷️ Harga beli/grosir (harga modal)"}
              </span>
              <span className="opacity-70">— bisa diedit per item</span>
            </div>
          )}

          {type !== "expense" && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
              />
              <input
                className="input pl-9"
                placeholder={
                  type === "sale"
                    ? "Cari produk untuk dijual..."
                    : "Cari produk yang dibeli dari supplier..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Produk grid atau form pengeluaran */}
        {type === "expense" ? (
          <div className="flex-1 p-5 space-y-4">
            <div>
              <label className="label">Kategori Pengeluaran</label>
              <div className="flex gap-2 flex-wrap">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setExpenseCategory(cat)}
                    className={cn(
                      "badge cursor-pointer text-xs",
                      expenseCategory === cat
                        ? "bg-orange-500 text-white border-orange-500"
                        : "hover:border-orange-300 text-orange-700 bg-orange-50 border-orange-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Deskripsi Pengeluaran *</label>
              <input
                className="input"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="Contoh: Bayar tagihan listrik bulan Maret..."
                autoFocus
              />
            </div>

            <div>
              <label className="label">Jumlah *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium">
                  Rp
                </span>
                <input
                  type="number"
                  className="input pl-9 text-lg font-bold"
                  value={expenseAmount || ""}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>

            <div>
              <label className="label">Catatan Tambahan</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opsional..."
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start scrollbar-thin">
            {filtered.map((product) => {
              const displayPrice = getDefaultPrice(product);
              const inCart = cart.find((i) => i.product.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={type === "sale" && product.stock === 0}
                  className={cn(
                    "card-hover p-3 text-left flex flex-col gap-1 active:scale-95 transition-transform relative",
                    inCart && "ring-2 ring-primary-400",
                    type === "sale" &&
                      product.stock === 0 &&
                      "opacity-40 cursor-not-allowed"
                  )}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {inCart.quantity}
                    </span>
                  )}
                  <p className="text-sm font-medium text-surface-800 line-clamp-2 flex-1 pr-5">
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "font-bold text-sm",
                        type === "sale" ? "text-primary-600" : "text-blue-600"
                      )}
                    >
                      {formatCurrency(displayPrice)}
                    </p>
                    <span className="text-xs text-surface-400">
                      {product.stock} {product.unit}
                    </span>
                  </div>
                  {type === "sale" && (
                    <p className="text-[10px] text-surface-400">
                      Modal: {formatCurrency(product.cost_price)}
                    </p>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-12 text-surface-400">
                <ShoppingCart size={28} className="mb-2 opacity-40" />
                <p className="text-xs">Produk tidak ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KANAN: Keranjang / Ringkasan */}
      <div className="col-span-2 flex flex-col card overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-800 flex items-center gap-2">
            <Receipt size={16} />
            {type === "expense" ? "Ringkasan Pengeluaran" : "Keranjang"}
            {cart.length > 0 && type !== "expense" && (
              <span className="ml-auto badge bg-primary-600 text-white border-primary-600 text-xs">
                {cart.length}
              </span>
            )}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {type === "expense" ? (
            <div className="h-full flex flex-col items-center justify-center text-surface-400 gap-2">
              {expenseAmount > 0 ? (
                <div className="w-full space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-orange-600 mb-1">
                      {expenseCategory}
                    </p>
                    <p className="text-xl font-bold text-orange-700">
                      {formatCurrency(expenseAmount)}
                    </p>
                    {expenseDesc && (
                      <p className="text-xs text-orange-600 mt-1 truncate">
                        {expenseDesc}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Receipt size={32} className="opacity-30" />
                  <p className="text-xs">Isi form pengeluaran di kiri</p>
                </>
              )}
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-300">
              <ShoppingCart size={32} className="mb-2 opacity-50" />
              <p className="text-xs">Pilih produk dari kiri</p>
            </div>
          ) : (
            cart.map((item) => {
              const margin = item.unit_price - item.product.cost_price;
              return (
                <div
                  key={item.product.id}
                  className="bg-surface-50 rounded-lg p-2.5 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <p className="text-xs font-medium text-surface-800 flex-1 line-clamp-1">
                      {item.product.name}
                    </p>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-surface-300 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="w-6 h-6 rounded-md bg-white border border-surface-200 flex items-center justify-center text-surface-600 hover:border-primary-400"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        disabled={
                          type === "sale" && item.quantity >= item.product.stock
                        }
                        className="w-6 h-6 rounded-md bg-white border border-surface-200 flex items-center justify-center text-surface-600 hover:border-primary-400 disabled:opacity-40"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-surface-400">Rp</span>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) =>
                          updatePrice(item.product.id, Number(e.target.value))
                        }
                        className="w-20 text-right text-xs font-semibold bg-transparent border-b border-dashed border-surface-300 focus:outline-none focus:border-primary-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-right text-xs font-bold text-primary-600">
                      = {formatCurrency(item.quantity * item.unit_price)}
                    </span>
                    {type === "sale" && (
                      <span
                        className={cn(
                          "text-[10px]",
                          margin >= 0 ? "text-green-500" : "text-red-400"
                        )}
                      >
                        laba {formatCurrency(margin * item.quantity)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-surface-100 space-y-3 bg-surface-50">
          {type !== "expense" && (
            <>
              <div>
                <label className="label text-xs">Pelanggan</label>
                <select
                  className="select text-sm py-2"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Pelanggan Umum</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">Pembayaran</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      "cash",
                      "transfer",
                      ...(type === "sale" ? ["debt"] : []),
                    ] as const
                  ).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m as any)}
                      className={cn(
                        "py-1.5 px-2 rounded-lg text-xs font-medium border transition-all",
                        paymentMethod === m
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-white border-surface-200 text-surface-600 hover:border-primary-300"
                      )}
                    >
                      {m === "cash"
                        ? "Tunai"
                        : m === "transfer"
                        ? "Transfer"
                        : "Hutang"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="label text-xs">Catatan</label>
            <input
              className="input text-sm py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opsional..."
            />
          </div>

          {/* Total & laba */}
          <div className="bg-white rounded-lg px-3 py-2.5 border border-surface-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-surface-600">
                Total
              </span>
              <span className="text-lg font-bold text-primary-600">
                {formatCurrency(total)}
              </span>
            </div>
            {type === "sale" && cart.length > 0 && (
              <div className="flex items-center justify-between border-t border-surface-100 pt-1.5">
                <span className="text-xs text-surface-400">
                  Estimasi laba kotor
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    grossProfit >= 0 ? "text-green-600" : "text-red-500"
                  )}
                >
                  {grossProfit >= 0 ? "+" : ""}
                  {formatCurrency(grossProfit)}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              (type !== "expense" && cart.length === 0) ||
              (type === "expense" && expenseAmount === 0)
            }
            className="btn-primary w-full"
          >
            {loading ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>
      </div>
    </div>
  );
}
