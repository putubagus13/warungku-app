"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Users,
  Tag,
  Store,
  LogOut,
  Landmark,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Produk",
    href: "/products",
    icon: Package,
  },
  {
    label: "Kategori",
    href: "/categories",
    icon: Tag,
  },
  {
    label: "Pelanggan",
    href: "/customers",
    icon: Users,
  },
  {
    label: "Transaksi",
    href: "/transactions",
    icon: ShoppingCart,
  },
  {
    label: "Hutang",
    href: "/debts",
    icon: CreditCard,
  },
  {
    label: "Laporan",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Modal & Investasi",
    href: "/capital",
    icon: Landmark,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-surface-200">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Store className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-surface-900 leading-none">
              WarungKu
            </p>
            <p className="text-[10px] text-surface-400 mt-0.5">
              Manajemen Warung
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-link", isActive && "active")}
            >
              <item.icon size={16} className="shrink-0" />
              <span>{item.label}</span>
              {isActive && (
                <ChevronRight size={14} className="ml-auto opacity-50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-surface-100">
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={16} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
