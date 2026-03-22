import { createServerClient } from "@/lib/supabase-server";
import { CategoryManager } from "@/components/categories/CategoryManager";
import { Category } from "@/types";

export const revalidate = 0;

export default async function CategoriesPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: categories } = (await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name")) as {
    data: Category[] | null;
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategori</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Kelola kategori produk Anda
          </p>
        </div>
      </div>
      <CategoryManager categories={categories || []} userId={user.id} />
    </div>
  );
}
