import { createServerClient } from "@/lib/supabase-server";
import { CustomerManager } from "@/components/customers/CustomerManager";
import { Customer } from "@/types";

export const revalidate = 0;

export default async function CustomersPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: customers } = (await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("name")) as { data: Customer[] | null };

  const { data: debtSummary } = await supabase
    .from("debts")
    .select("customer_id, remaining_amount")
    .eq("user_id", user.id)
    .in("status", ["unpaid", "partial"]);

  const debtMap: Record<string, number> = {};
  debtSummary?.forEach((d: any) => {
    debtMap[d.customer_id] = (debtMap[d.customer_id] || 0) + d.remaining_amount;
  });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pelanggan</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            {customers?.length || 0} pelanggan terdaftar
          </p>
        </div>
      </div>
      <CustomerManager
        customers={customers || []}
        debtMap={debtMap}
        userId={user.id}
      />
    </div>
  );
}
