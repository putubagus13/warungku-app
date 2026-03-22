"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Banknote, Eye, Trash2 } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui";
import { formatCurrency } from "@/utils";
import type { Debt, PaymentMethod } from "@/types";

export function DebtActions({ debt }: { debt: Debt }) {
  const router = useRouter();
  const supabase = createClient();
  const [payModal, setPayModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payAmount, setPayAmount] = useState(debt.remaining_amount);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payNotes, setPayNotes] = useState("");

  const handlePay = async () => {
    if (payAmount <= 0) return toast.error("Jumlah bayar harus lebih dari 0");
    if (payAmount > debt.remaining_amount)
      return toast.error("Jumlah melebihi sisa hutang");

    setLoading(true);
    try {
      // Insert payment record
      const { error: payErr } = await supabase.from("debt_payments").insert({
        debt_id: debt.id,
        amount: payAmount,
        payment_method: payMethod,
        notes: payNotes || null,
      } as any); // Type assertion needed due to Supabase type inference issue
      if (payErr) throw payErr;

      // Update remaining amount and status
      const newRemaining = debt.remaining_amount - payAmount;
      const newStatus = newRemaining <= 0 ? "paid" : "partial";

      const { error: updateErr } = await (supabase as any)
        .from("debts")
        .update({ remaining_amount: newRemaining, status: newStatus })
        .eq("id", debt.id);
      if (updateErr) throw updateErr;

      toast.success(
        newStatus === "paid"
          ? "🎉 Hutang lunas!"
          : `Pembayaran Rp ${payAmount.toLocaleString(
              "id-ID"
            )} berhasil dicatat`
      );
      setPayModal(false);
      router.refresh();
    } catch (err: any) {
      toast.error("Gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await supabase.from("debts").delete().eq("id", debt.id);
    if (error) {
      toast.error("Gagal menghapus catatan hutang");
    } else {
      toast.success("Catatan hutang dihapus");
      router.refresh();
    }
    setLoading(false);
    setDeleteConfirm(false);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {debt.status !== "paid" && (
          <button
            onClick={() => {
              setPayAmount(debt.remaining_amount);
              setPayModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors"
          >
            <Banknote size={12} /> Bayar
          </button>
        )}
        <button
          onClick={() => setDeleteConfirm(true)}
          className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Pay Modal */}
      <Modal
        isOpen={payModal}
        onClose={() => setPayModal(false)}
        title="Catat Pembayaran Hutang"
        size="sm"
      >
        <div className="space-y-4">
          {/* Debt info */}
          <div className="bg-surface-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Pelanggan</span>
              <span className="font-semibold text-surface-800">
                {(debt.customer as any)?.name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Total Hutang</span>
              <span className="font-medium text-surface-700">
                {formatCurrency(debt.original_amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-surface-200 pt-2 mt-2">
              <span className="text-surface-500">Sisa Hutang</span>
              <span className="font-bold text-red-500">
                {formatCurrency(debt.remaining_amount)}
              </span>
            </div>
          </div>

          <div>
            <label className="label">Jumlah Bayar *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium">
                Rp
              </span>
              <input
                type="number"
                className="input pl-9"
                value={payAmount || ""}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                max={debt.remaining_amount}
                min={1}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setPayAmount(debt.remaining_amount)}
                className="text-xs text-primary-600 hover:underline"
              >
                Bayar semua ({formatCurrency(debt.remaining_amount)})
              </button>
            </div>
          </div>

          <div>
            <label className="label">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              {(["cash", "transfer"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPayMethod(m)}
                  className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                    payMethod === m
                      ? "bg-primary-600 text-white border-primary-600"
                      : "border-surface-200 text-surface-600 hover:border-primary-300"
                  }`}
                >
                  {m === "cash" ? "💵 Tunai" : "🏦 Transfer"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Catatan</label>
            <input
              className="input"
              placeholder="Opsional"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
            />
          </div>

          {/* Preview */}
          {payAmount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
              <p className="text-green-700 font-medium">
                Sisa setelah bayar:{" "}
                {formatCurrency(Math.max(0, debt.remaining_amount - payAmount))}
              </p>
              {payAmount >= debt.remaining_amount && (
                <p className="text-green-600 text-xs mt-0.5">
                  ✓ Hutang akan dinyatakan LUNAS
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={() => setPayModal(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              onClick={handlePay}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Memproses..." : "Konfirmasi Bayar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Hapus Catatan Hutang"
        description={`Hapus catatan hutang ${
          (debt.customer as any)?.name
        } sebesar ${formatCurrency(
          debt.original_amount
        )}? Semua riwayat pembayaran juga akan dihapus.`}
        loading={loading}
      />
    </>
  );
}
