"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Customer } from "@/types";

interface Props {
  customers: Pick<Customer, "id" | "name">[];
  userId: string;
}

export function DebtForm({ customers, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    original_amount: 0,
    due_date: "",
    notes: "",
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id) return toast.error("Pilih pelanggan");
    if (form.original_amount <= 0)
      return toast.error("Jumlah hutang harus lebih dari 0");

    setLoading(true);
    //@ts-ignore
    const { error } = await supabase.from("debts").insert({
      user_id: userId,
      customer_id: form.customer_id,
      original_amount: form.original_amount,
      remaining_amount: form.original_amount,
      status: "unpaid",
      due_date: form.due_date || null,
      notes: form.notes || null,
    });

    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success("Hutang berhasil dicatat");
      router.push("/debts");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <label className="label">Pelanggan *</label>
        <select
          className="select"
          value={form.customer_id}
          onChange={(e) => set("customer_id", e.target.value)}
          required
        >
          <option value="">Pilih pelanggan...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Jumlah Hutang *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium">
            Rp
          </span>
          <input
            type="number"
            className="input pl-9"
            value={form.original_amount || ""}
            onChange={(e) => set("original_amount", Number(e.target.value))}
            placeholder="0"
            min={0}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Jatuh Tempo</label>
        <input
          type="date"
          className="input"
          value={form.due_date}
          onChange={(e) => set("due_date", e.target.value)}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>

      <div>
        <label className="label">Keterangan</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Misal: hutang sembako bulan Januari..."
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Menyimpan..." : "Simpan Hutang"}
        </button>
      </div>
    </form>
  );
}
