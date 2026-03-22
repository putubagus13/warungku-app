import { createServerClient } from "@/lib/supabase-server";
import { ProductForm } from "@/components/products/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!product) return notFound();

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
          <h1 className="page-title">Edit Produk</h1>
          <p className="text-sm text-surface-400">
            {(product as { name: string }).name}
          </p>
        </div>
      </div>
      <ProductForm
        product={product}
        categories={categories || []}
        userId={user.id}
      />
    </div>
  );
}
