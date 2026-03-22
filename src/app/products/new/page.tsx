import { createServerClient } from "@/lib/supabase-server";
import { ProductForm } from "@/components/products/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewProductPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/products" className="btn-ghost btn-sm">
          <ArrowLeft size={16} /> Kembali
        </Link>
        <div>
          <h1 className="page-title">Tambah Produk Baru</h1>
          <p className="text-sm text-surface-400">
            Isi detail produk yang ingin Anda tambahkan
          </p>
        </div>
      </div>
      <ProductForm categories={categories || []} userId={user.id} />
    </div>
  );
}
