"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Modal, ConfirmDialog, EmptyState } from "@/components/ui";
import type { Category, Database } from "@/types";

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#84cc16",
];
const ICONS = [
  "tag",
  "package",
  "coffee",
  "apple",
  "shoppingbag",
  "home",
  "zap",
  "star",
  "heart",
  "gift",
];

interface Props {
  categories: Category[];
  userId: string;
}

export function CategoryManager({ categories: initial, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "#22c55e",
    icon: "tag",
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", color: "#22c55e", icon: "tag" });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || "",
      color: cat.color,
      icon: cat.icon,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Nama kategori wajib diisi");
    setLoading(true);
    if (editing) {
      const updateData = {
        name: form.name,
        description: form.description,
        color: form.color,
        icon: form.icon,
      };
      const { error } = await (supabase.from("categories") as any)
        .update(updateData)
        .eq("id", editing.id);
      if (error) {
        toast.error("Gagal memperbarui kategori");
        setLoading(false);
        return;
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...form } : c))
      );
      toast.success("Kategori diperbarui");
    } else {
      const insertData = {
        name: form.name,
        description: form.description,
        color: form.color,
        icon: form.icon,
        user_id: userId,
      };
      const { data, error } = await (supabase.from("categories") as any)
        .insert(insertData)
        .select()
        .single();
      if (error) {
        toast.error("Gagal menambah kategori");
        setLoading(false);
        return;
      }
      setCategories((prev) => [...prev, data]);
      toast.success("Kategori ditambahkan");
    }
    setShowModal(false);
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus kategori");
      setLoading(false);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success("Kategori dihapus");
    setShowDelete(null);
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Add new card */}
        <button
          onClick={openNew}
          className="card p-4 flex flex-col items-center justify-center gap-2 h-28 border-dashed border-2 border-surface-200 hover:border-primary-400 hover:bg-primary-50 text-surface-400 hover:text-primary-600 transition-all group"
        >
          <Plus
            size={22}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="text-xs font-medium">Tambah Kategori</span>
        </button>

        {categories.length === 0 && (
          <div className="col-span-3 card py-12 flex flex-col items-center justify-center text-center">
            <Tag size={32} className="text-surface-300 mb-2" />
            <p className="text-sm font-medium text-surface-500">
              Belum ada kategori
            </p>
            <p className="text-xs text-surface-400 mt-1">
              Tambahkan kategori untuk mengorganisir produk Anda
            </p>
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat.id} className="card-hover p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                style={{ background: cat.color + "20", color: cat.color }}
              >
                <Tag size={16} />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(cat)}
                  className="w-6 h-6 rounded hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-primary-600"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={() => setShowDelete(cat.id)}
                  className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm text-surface-800">
                {cat.name}
              </p>
              {cat.description && (
                <p className="text-xs text-surface-400 mt-0.5 line-clamp-1">
                  {cat.description}
                </p>
              )}
            </div>
            <div
              className="h-1 rounded-full"
              style={{ background: cat.color }}
            />
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Kategori" : "Tambah Kategori"}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nama Kategori *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Contoh: Minuman, Makanan, Rokok..."
              autoFocus
            />
          </div>
          <div>
            <label className="label">Deskripsi</label>
            <input
              className="input"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Opsional"
            />
          </div>
          <div>
            <label className="label">Warna</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: form.color === c ? `3px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="btn-secondary btn-sm"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary btn-sm"
            >
              {loading ? "Menyimpan..." : editing ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!showDelete}
        onClose={() => setShowDelete(null)}
        onConfirm={() => showDelete && handleDelete(showDelete)}
        title="Hapus Kategori"
        description="Produk yang terhubung tidak akan terhapus, hanya kategorinya yang dihapus."
        loading={loading}
      />
    </>
  );
}
