"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Modal, ConfirmDialog, EmptyState, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/utils";
import {
  getCapitalTypeLabel,
  getCapitalTypeColor,
  getCapitalTypeIcon,
  isInflow,
} from "@/utils/capital";
import { cn } from "@/utils";
import type { CapitalEntry, CapitalType } from "@/types";

interface Props {
  entries: CapitalEntry[];
  userId: string;
}

const CAPITAL_TYPES: { value: CapitalType; label: string; desc: string }[] = [
  {
    value: "initial",
    label: "Modal Awal",
    desc: "Modal pertama saat membuka warung",
  },
  {
    value: "addition",
    label: "Tambah Modal",
    desc: "Penambahan modal dari pemilik",
  },
  {
    value: "loan",
    label: "Pinjaman",
    desc: "Pinjaman dari bank, keluarga, dll",
  },
  {
    value: "investor",
    label: "Investasi",
    desc: "Modal dari investor / mitra",
  },
  {
    value: "withdrawal",
    label: "Penarikan",
    desc: "Penarikan modal oleh pemilik",
  },
];

const emptyForm = {
  type: "initial" as CapitalType,
  source: "",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
  notes: "",
  is_loan: false,
  loan_due_date: "",
  loan_paid: false,
};

export function CapitalManager({ entries: initial, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [entries, setEntries] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<CapitalEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<CapitalType | "all">("all");

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.type === filter);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (e: CapitalEntry) => {
    setEditing(e);
    setForm({
      type: e.type,
      source: e.source,
      amount: e.amount,
      date: e.date,
      notes: e.notes || "",
      is_loan: e.is_loan,
      loan_due_date: e.loan_due_date || "",
      loan_paid: e.loan_paid,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.source.trim()) return toast.error("Sumber modal wajib diisi");
    if (form.amount <= 0) return toast.error("Jumlah harus lebih dari 0");

    setLoading(true);
    const payload = {
      type: form.type,
      source: form.source,
      amount: form.amount,
      date: form.date,
      notes: form.notes || null,
      is_loan: form.type === "loan",
      loan_due_date:
        form.type === "loan" && form.loan_due_date ? form.loan_due_date : null,
      loan_paid: form.loan_paid,
    };

    if (editing) {
      const { error } = await supabase
        .from("capital_entries")
        //@ts-ignore
        .update(payload)
        .eq("id", editing.id);

      if (error) {
        toast.error("Gagal memperbarui: " + error.message);
        setLoading(false);
        return;
      }
      setEntries((prev) =>
        prev.map((e) => (e.id === editing.id ? { ...e, ...payload } : e))
      );
      toast.success("Data modal diperbarui");
    } else {
      const { data, error } = await supabase
        .from("capital_entries")
        //@ts-ignore
        .insert({ ...payload, user_id: userId })
        .select()
        .single();

      if (error) {
        toast.error("Gagal menyimpan: " + error.message);
        setLoading(false);
        return;
      }
      setEntries((prev) => [data, ...prev]);
      toast.success("Modal berhasil dicatat!");
    }

    setShowModal(false);
    setLoading(false);
    router.refresh();
  };

  const handleLoanPaid = async (entry: CapitalEntry) => {
    const { error } = await supabase
      .from("capital_entries")
      //@ts-ignore
      .update({ loan_paid: true })
      .eq("id", entry.id);

    if (error) {
      toast.error("Gagal memperbarui");
      return;
    }
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, loan_paid: true } : e))
    );
    toast.success("Pinjaman ditandai lunas!");
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("capital_entries")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Gagal menghapus");
      setLoading(false);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Data dihapus");
    setShowDelete(null);
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-surface-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-surface-800">
              Riwayat Modal & Investasi
            </h3>
            <p className="text-xs text-surface-400 mt-0.5">
              {entries.length} entri tercatat
            </p>
          </div>
          <button onClick={openNew} className="btn-primary btn-sm">
            <Plus size={14} /> Tambah Entri
          </button>
        </div>

        {/* Filter tabs */}
        <div className="px-5 py-3 border-b border-surface-100 flex gap-2 flex-wrap">
          {(
            [
              "all",
              "initial",
              "addition",
              "loan",
              "investor",
              "withdrawal",
            ] as const
          ).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "badge cursor-pointer transition-all text-xs",
                filter === f
                  ? "bg-primary-600 text-white border-primary-600"
                  : "hover:border-primary-300"
              )}
            >
              {f === "all" ? "Semua" : getCapitalTypeLabel(f as CapitalType)}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<TrendingUp size={24} />}
            title="Belum ada data modal"
            description="Tambahkan modal awal warung untuk mulai melacak kesehatan keuangan"
            action={
              <button onClick={openNew} className="btn-primary btn-sm">
                <Plus size={14} /> Tambah Modal Awal
              </button>
            }
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Sumber / Keterangan</th>
                <th>Status</th>
                <th className="text-right">Jumlah</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const inflow = isInflow(entry.type);
                const isOverdue =
                  entry.type === "loan" &&
                  !entry.loan_paid &&
                  entry.loan_due_date &&
                  new Date(entry.loan_due_date) < new Date();

                return (
                  <tr key={entry.id}>
                    <td className="text-xs text-surface-500 whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td>
                      <span
                        className={cn(
                          "badge text-xs",
                          getCapitalTypeColor(entry.type)
                        )}
                      >
                        <span>{getCapitalTypeIcon(entry.type)}</span>
                        {getCapitalTypeLabel(entry.type)}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-surface-800">
                        {entry.source}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-surface-400 truncate max-w-45">
                          {entry.notes}
                        </p>
                      )}
                      {entry.type === "loan" && entry.loan_due_date && (
                        <p
                          className={cn(
                            "text-xs mt-0.5",
                            isOverdue
                              ? "text-red-500 font-medium"
                              : "text-surface-400"
                          )}
                        >
                          {isOverdue
                            ? "⚠️ Lewat jatuh tempo: "
                            : "Jatuh tempo: "}
                          {formatDate(entry.loan_due_date)}
                        </p>
                      )}
                    </td>
                    <td>
                      {entry.type === "loan" ? (
                        entry.loan_paid ? (
                          <Badge variant="success">Lunas</Badge>
                        ) : (
                          <Badge variant="warning">Belum lunas</Badge>
                        )
                      ) : (
                        <Badge variant={inflow ? "success" : "danger"}>
                          {inflow ? "Masuk" : "Keluar"}
                        </Badge>
                      )}
                    </td>
                    <td className="text-right">
                      <span
                        className={cn(
                          "font-bold text-sm",
                          entry.type === "withdrawal"
                            ? "text-red-500"
                            : "text-surface-800"
                        )}
                      >
                        {entry.type === "withdrawal" ? "-" : "+"}
                        {formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {entry.type === "loan" && !entry.loan_paid && (
                          <button
                            onClick={() => handleLoanPaid(entry)}
                            className="text-xs px-2 py-1 rounded-md bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors whitespace-nowrap"
                          >
                            Tandai Lunas
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(entry)}
                          className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-primary-600"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setShowDelete(entry.id)}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Entri Modal" : "Tambah Modal / Investasi"}
        size="md"
      >
        <div className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="label">Jenis</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CAPITAL_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => set("type", ct.value)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 p-2.5 rounded-lg border text-left transition-all",
                    form.type === ct.value
                      ? "border-primary-400 bg-primary-50"
                      : "border-surface-200 hover:border-surface-300 bg-white"
                  )}
                >
                  <span className="text-sm font-medium text-surface-800">
                    {getCapitalTypeIcon(ct.value)} {ct.label}
                  </span>
                  <span className="text-[10px] text-surface-400 leading-tight">
                    {ct.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sumber *</label>
              <input
                className="input"
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                placeholder={
                  form.type === "loan"
                    ? "Bank BRI / Koperasi..."
                    : form.type === "investor"
                    ? "Nama investor..."
                    : form.type === "withdrawal"
                    ? "Kebutuhan pribadi..."
                    : "Modal sendiri..."
                }
                autoFocus
              />
            </div>
            <div>
              <label className="label">Tanggal *</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Jumlah *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium">
                Rp
              </span>
              <input
                type="number"
                className="input pl-9"
                value={form.amount || ""}
                onChange={(e) => set("amount", Number(e.target.value))}
                placeholder="0"
                min={0}
              />
            </div>
          </div>

          {form.type === "loan" && (
            <div>
              <label className="label">Jatuh Tempo Pinjaman</label>
              <input
                type="date"
                className="input"
                value={form.loan_due_date}
                onChange={(e) => set("loan_due_date", e.target.value)}
              />
              <p className="text-xs text-surface-400 mt-1">
                Kosongkan jika tidak ada jatuh tempo yang ditentukan
              </p>
            </div>
          )}

          {form.type === "loan" && editing && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="loan_paid"
                checked={form.loan_paid}
                onChange={(e) => set("loan_paid", e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-primary-600"
              />
              <label
                htmlFor="loan_paid"
                className="text-sm text-surface-700 cursor-pointer"
              >
                Tandai pinjaman ini sudah lunas
              </label>
            </div>
          )}

          <div>
            <label className="label">Catatan</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Keterangan tambahan (opsional)..."
            />
          </div>

          {/* Preview */}
          {form.amount > 0 && (
            <div
              className={cn(
                "rounded-lg px-4 py-3 text-sm flex items-center justify-between",
                isInflow(form.type)
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              )}
            >
              <span
                className={
                  isInflow(form.type) ? "text-green-700" : "text-red-700"
                }
              >
                {isInflow(form.type) ? "↑ Modal masuk" : "↓ Modal keluar"}
              </span>
              <span
                className={cn(
                  "font-bold",
                  isInflow(form.type) ? "text-green-700" : "text-red-700"
                )}
              >
                {formatCurrency(form.amount)}
              </span>
            </div>
          )}

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
              {loading
                ? "Menyimpan..."
                : editing
                ? "Simpan Perubahan"
                : "Tambah Entri"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!showDelete}
        onClose={() => setShowDelete(null)}
        onConfirm={() => showDelete && handleDelete(showDelete)}
        title="Hapus Entri Modal"
        description="Data modal ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
        loading={loading}
      />
    </>
  );
}
