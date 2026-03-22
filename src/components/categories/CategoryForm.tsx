"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Category } from "@/types";

interface Props {
  category?: Category;
  presetColors: string[];
  onClose: () => void;
}

export function CategoryForm({ category, presetColors, onClose }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    color: category?.color || presetColors[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nama kategori wajib diisi");
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak terautentikasi");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        color: form.color,
      };

      if (category) {
        const { error } = await supabase
          .from("categories")
          //@ts-ignore
          .update(payload)
          .eq("id", category.id);
        if (error) throw error;
        toast.success("Kategori diperbarui");
      } else {
        const { error } = await supabase
          .from("categories")
          //@ts-ignore
          .insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success("Kategori ditambahkan");
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nama Kategori *</label>
        <input
          className="input"
          placeholder="Contoh: Minuman, Makanan..."
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label">Deskripsi</label>
        <input
          className="input"
          placeholder="Opsional"
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">Warna</label>
        <div className="flex gap-2 flex-wrap">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm((p) => ({ ...p, color }))}
              className="w-8 h-8 rounded-lg border-2 transition-all"
              style={{
                backgroundColor: color,
                borderColor: form.color === color ? color : "transparent",
                boxShadow:
                  form.color === color
                    ? `0 0 0 2px white, 0 0 0 4px ${color}`
                    : "none",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary flex-1"
        >
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Menyimpan..." : category ? "Perbarui" : "Tambah"}
        </button>
      </div>
    </form>
  );
}
