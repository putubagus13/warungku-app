"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { generateSKU } from "@/utils";
import type { Product, Category } from "@/types";

interface Props {
  product?: Product;
  categories: Category[];
  userId: string;
}

const UNITS = [
  "pcs",
  "kg",
  "gram",
  "liter",
  "ml",
  "lusin",
  "karton",
  "pack",
  "botol",
  "dus",
];

export function ProductForm({ product, categories, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    category_id: product?.category_id || "",
    description: product?.description || "",
    price: product?.price || 0,
    cost_price: product?.cost_price || 0,
    stock: product?.stock || 0,
    unit: product?.unit || "pcs",
    min_stock: product?.min_stock || 5,
    is_active: product?.is_active ?? true,
  });

  const set = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nama produk wajib diisi");
    if (form.price <= 0) return toast.error("Harga jual harus lebih dari 0");

    setLoading(true);
    const payload = {
      ...form,
      user_id: userId,
      sku: form.sku || generateSKU(form.name),
      category_id: form.category_id || null,
    };

    const { error } = product
      ? await supabase
          .from("products")
          //@ts-ignore
          .update(payload)
          .eq("id", product.id)
      : await supabase
          .from("products")
          //@ts-ignore
          .insert(payload);

    if (error) {
      toast.error("Gagal menyimpan produk: " + error.message);
    } else {
      toast.success(
        product ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan"
      );
      router.push("/products");
      router.refresh();
    }
    setLoading(false);
  };

  const margin =
    form.cost_price > 0
      ? (((form.price - form.cost_price) / form.cost_price) * 100).toFixed(1)
      : "0";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-surface-800 text-sm">
          Informasi Dasar
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nama Produk *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Contoh: Indomie Goreng"
              required
            />
          </div>
          <div>
            <label className="label">SKU</label>
            <input
              className="input font-mono text-sm"
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              placeholder="Auto-generate jika kosong"
            />
          </div>
          <div>
            <label className="label">Kategori</label>
            <select
              className="select"
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
            >
              <option value="">Tanpa Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Deskripsi</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Deskripsi singkat produk (opsional)"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-surface-800 text-sm">
          Harga & Keuntungan
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Harga Beli (Modal) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium">
                Rp
              </span>
              <input
                type="number"
                className="input pl-9"
                value={form.cost_price || ""}
                onChange={(e) => set("cost_price", Number(e.target.value))}
                placeholder="0"
                min={0}
              />
            </div>
          </div>
          <div>
            <label className="label">Harga Jual *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium">
                Rp
              </span>
              <input
                type="number"
                className="input pl-9"
                value={form.price || ""}
                onChange={(e) => set("price", Number(e.target.value))}
                placeholder="0"
                min={0}
                required
              />
            </div>
          </div>
        </div>
        {form.cost_price > 0 && form.price > 0 && (
          <div className="bg-surface-50 rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="text-sm">
              <span className="text-surface-500">Margin keuntungan: </span>
              <span
                className={`font-bold ${
                  Number(margin) >= 20
                    ? "text-green-600"
                    : Number(margin) >= 0
                    ? "text-yellow-600"
                    : "text-red-500"
                }`}
              >
                {margin}%
              </span>
            </div>
            <div className="text-sm ml-auto">
              <span className="text-surface-500">Untung: </span>
              <span className="font-bold text-green-600">
                Rp {(form.price - form.cost_price).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stock */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-surface-800 text-sm">
          Stok & Satuan
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Stok Awal</label>
            <input
              type="number"
              className="input"
              value={form.stock || ""}
              onChange={(e) => set("stock", Number(e.target.value))}
              placeholder="0"
              min={0}
            />
          </div>
          <div>
            <label className="label">Satuan</label>
            <select
              className="select"
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Stok Minimum</label>
            <input
              type="number"
              className="input"
              value={form.min_stock || ""}
              onChange={(e) => set("min_stock", Number(e.target.value))}
              placeholder="5"
              min={0}
            />
          </div>
        </div>
        <p className="text-xs text-surface-400">
          Anda akan mendapat peringatan ketika stok mencapai atau di bawah stok
          minimum.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading
            ? "Menyimpan..."
            : product
            ? "Simpan Perubahan"
            : "Tambah Produk"}
        </button>
      </div>
    </form>
  );
}
