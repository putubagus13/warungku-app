"use client";

import { useState } from "react";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Product } from "@/types";

export function ProductActions({ product }: { product: Product }) {
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("products")
      //@ts-ignore
      .update({ is_active: false })
      .eq("id", product.id);

    if (error) {
      toast.error("Gagal menghapus produk");
    } else {
      toast.success("Produk berhasil dihapus");
      router.refresh();
    }
    setDeleting(false);
    setShowDelete(false);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Link
          href={`/products/${product.id}`}
          className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-primary-600 transition-colors"
        >
          <Pencil size={13} />
        </Link>
        <button
          onClick={() => setShowDelete(true)}
          className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Hapus Produk"
        description={`Apakah Anda yakin ingin menghapus produk "${product.name}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
      />
    </>
  );
}
