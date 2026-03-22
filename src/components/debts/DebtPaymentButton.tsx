"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui";
import { formatCurrency } from "@/utils";
import { Banknote } from "lucide-react";
import type { DebtStatus, Database } from "@/types";

interface Props {
  debt: {
    id: string;
    remaining_amount: number;
    customer?: { name: string };
  };
}

export function DebtPaymentButton({ debt }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(debt.remaining_amount);
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handlePay = async () => {
    if (amount <= 0) return toast.error("Jumlah bayar harus lebih dari 0");
    if (amount > debt.remaining_amount)
      return toast.error("Jumlah melebihi sisa hutang");

    setLoading(true);
    const newRemaining = debt.remaining_amount - amount;
    const newStatus = newRemaining <= 0 ? "paid" : "partial";

    // Insert payment record
    const { error: payErr } = await supabase.from("debt_payments").insert({
      debt_id: debt.id,
      amount,
      payment_method: method,
      notes: notes || null,
    } as any);

    if (payErr) {
      toast.error("Gagal mencatat pembayaran");
      setLoading(false);
      return;
    }

    // Update debt status
    const { error: updateErr } = await supabase
      .from("debts")
      //@ts-ignore
      .update({ remaining_amount: newRemaining, status: newStatus })
      .eq("id", debt.id);

    if (updateErr) {
      toast.error("Gagal memperbarui status hutang");
      setLoading(false);
      return;
    }

    toast.success(
      newStatus === "paid" ? "✅ Hutang lunas!" : "Pembayaran dicatat"
    );
    setOpen(false);
    router.refresh();
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary btn-sm">
        <Banknote size={13} /> Bayar
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Catat Pembayaran Hutang"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 rounded-lg px-4 py-3 text-sm">
            <p className="text-amber-700 font-medium">{debt.customer?.name}</p>
            <p className="text-amber-600 text-xs mt-0.5">
              Sisa hutang:{" "}
              <strong>{formatCurrency(debt.remaining_amount)}</strong>
            </p>
          </div>

          <div>
            <label className="label">Jumlah Bayar *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                Rp
              </span>
              <input
                type="number"
                className="input pl-9"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                max={debt.remaining_amount}
                min={1}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() =>
                  setAmount(Math.round(debt.remaining_amount * 0.5))
                }
                className="btn-secondary btn-sm text-xs"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setAmount(debt.remaining_amount)}
                className="btn-secondary btn-sm text-xs"
              >
                Lunasi Semua
              </button>
            </div>
          </div>

          <div>
            <label className="label">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              {(["cash", "transfer"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    method === m
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white border-surface-200 text-surface-600 hover:border-primary-300"
                  }`}
                >
                  {m === "cash" ? "Tunai" : "Transfer"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Catatan</label>
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opsional..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={() => setOpen(false)}
              className="btn-secondary btn-sm"
            >
              Batal
            </button>
            <button
              onClick={handlePay}
              disabled={loading}
              className="btn-primary btn-sm"
            >
              {loading ? "Menyimpan..." : "Simpan Pembayaran"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
