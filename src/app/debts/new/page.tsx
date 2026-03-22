import { createServerClient } from "@/lib/supabase-server";
import { DebtForm } from "@/components/debts/DebtForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewDebtPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/debts" className="btn-ghost btn-sm">
          <ArrowLeft size={16} /> Kembali
        </Link>
        <div>
          <h1 className="page-title">Catat Hutang Baru</h1>
          <p className="text-sm text-surface-400">
            Tambahkan catatan hutang pelanggan
          </p>
        </div>
      </div>
      <DebtForm customers={customers || []} userId={user.id} />
    </div>
  );
}
