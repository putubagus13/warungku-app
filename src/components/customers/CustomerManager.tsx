"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Phone,
  MapPin,
  CreditCard,
  Search,
} from "lucide-react";
import { Modal, ConfirmDialog, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/utils";
import Link from "next/link";
import type { Customer, Database } from "@/types";

interface Props {
  customers: Customer[];
  debtMap: Record<string, number>;
  userId: string;
}

const emptyForm = { name: "", phone: "", address: "", notes: "" };

export function CustomerManager({
  customers: initial,
  debtMap,
  userId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [customers, setCustomers] = useState(initial);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search)
  );

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone || "",
      address: c.address || "",
      notes: c.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Nama pelanggan wajib diisi");
    setLoading(true);
    const payload = {
      name: form.name,
      phone: form.phone || null,
      address: form.address || null,
      notes: form.notes || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("customers")
        // @ts-ignore
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error("Gagal memperbarui pelanggan");
        setLoading(false);
        return;
      }
      setCustomers((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...payload } : c))
      );
      toast.success("Pelanggan diperbarui");
    } else {
      const { data, error } = await supabase
        .from("customers")
        // @ts-ignore
        .insert({ ...payload, user_id: userId, is_active: true })
        .select()
        .single();
      if (error) {
        toast.error("Gagal menambah pelanggan");
        setLoading(false);
        return;
      }
      setCustomers((prev) => [...prev, data]);
      toast.success("Pelanggan ditambahkan");
    }
    setShowModal(false);
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("customers")
      // @ts-ignore
      .update({ is_active: false })
      .eq("id", id);
    if (error) {
      toast.error("Gagal menghapus pelanggan");
      setLoading(false);
      return;
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    toast.success("Pelanggan dihapus");
    setShowDelete(null);
    setLoading(false);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  const getBg = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-violet-100 text-violet-700",
      "bg-pink-100 text-pink-700",
      "bg-amber-100 text-amber-700",
      "bg-teal-100 text-teal-700",
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <>
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
          />
          <input
            className="input pl-9"
            placeholder="Cari nama atau nomor HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={16} /> Tambah Pelanggan
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users size={24} />}
            title="Belum ada pelanggan"
            description="Tambahkan pelanggan untuk mencatat transaksi dan hutang"
            action={
              <button onClick={openNew} className="btn-primary btn-sm">
                <Plus size={14} /> Tambah
              </button>
            }
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Pelanggan</th>
                <th>No. HP</th>
                <th>Alamat</th>
                <th>Sisa Hutang</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getBg(
                          c.name
                        )}`}
                      >
                        {getInitials(c.name)}
                      </div>
                      <div>
                        <p className="font-medium text-surface-800">{c.name}</p>
                        {c.notes && (
                          <p className="text-xs text-surface-400 truncate max-w-30">
                            {c.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone}`}
                        className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                      >
                        <Phone size={12} /> {c.phone}
                      </a>
                    ) : (
                      <span className="text-surface-300">—</span>
                    )}
                  </td>
                  <td>
                    {c.address ? (
                      <span className="text-sm text-surface-500 flex items-center gap-1">
                        <MapPin size={11} className="shrink-0" />
                        {c.address}
                      </span>
                    ) : (
                      <span className="text-surface-300">—</span>
                    )}
                  </td>
                  <td>
                    {debtMap[c.id] ? (
                      <Link
                        href={`/debts?customer=${c.id}`}
                        className="font-semibold text-red-600 hover:underline text-sm flex items-center gap-1"
                      >
                        <CreditCard size={12} />
                        {formatCurrency(debtMap[c.id])}
                      </Link>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">
                        Lunas
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-primary-600"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setShowDelete(c.id)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Pelanggan" : "Tambah Pelanggan"}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nama *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nama lengkap pelanggan"
              autoFocus
            />
          </div>
          <div>
            <label className="label">No. HP</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder="08xxxxxxxxxx"
              type="tel"
            />
          </div>
          <div>
            <label className="label">Alamat</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              placeholder="Alamat pelanggan (opsional)"
            />
          </div>
          <div>
            <label className="label">Catatan</label>
            <input
              className="input"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Catatan tambahan (opsional)"
            />
          </div>
          <div className="flex gap-3 justify-end pt-1">
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
        title="Hapus Pelanggan"
        description="Data pelanggan akan dinonaktifkan. Riwayat transaksi tidak akan terhapus."
        loading={loading}
      />
    </>
  );
}
