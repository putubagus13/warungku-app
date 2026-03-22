"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Modal } from "@/components/ui";
import { CustomerForm } from "./CustomerForm";
import toast from "react-hot-toast";
import type { Customer } from "@/types";

export function CustomerActions({ customer }: { customer: Customer }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("customers")
      // @ts-ignore
      .update({ is_active: false })
      .eq("id", customer.id);
    if (error) {
      toast.error("Gagal menghapus pelanggan");
    } else {
      toast.success("Pelanggan dihapus");
      router.refresh();
    }
    setDeleting(false);
    setOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400"
        >
          <MoreHorizontal size={15} />
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-surface-200 shadow-modal py-1 w-36">
              <button
                onClick={() => {
                  setOpen(false);
                  setEditOpen(true);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                <Trash2 size={13} /> Hapus
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Pelanggan"
      >
        <CustomerForm customer={customer} />
      </Modal>
    </>
  );
}
