"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import type { Customer } from "@/types";

interface Props {
  customer?: Customer;
}

export function CustomerForm({ customer }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    notes: customer?.notes || "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nama wajib diisi");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak terautentikasi");

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (customer) {
        const { error } = await supabase
          .from("customers")
          // @ts-ignore
          .update(payload)
          .eq("id", customer.id);
        if (error) throw error;
        toast.success("Pelanggan berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("customers")
          // @ts-ignore
          .insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success("Pelanggan berhasil ditambahkan");
      }

      router.push("/customers");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nama Pelanggan *</label>
        <input
          className="input"
          placeholder="Contoh: Budi Santoso"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label">Nomor Telepon</label>
        <input
          className="input"
          placeholder="Contoh: 0812-3456-7890"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          type="tel"
        />
      </div>

      <div>
        <label className="label">Alamat</label>
        <textarea
          className="input resize-none"
          placeholder="Alamat lengkap pelanggan"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <label className="label">Catatan</label>
        <textarea
          className="input resize-none"
          placeholder="Catatan tambahan (opsional)"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1"
        >
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Menyimpan..." : customer ? "Perbarui" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
