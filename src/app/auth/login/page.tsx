import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { LoginForm } from "@/components/auth/LoginForm";
import { Store } from "lucide-react";

export default async function LoginPage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">WarungKu</h1>
          <p className="text-surface-500 text-sm mt-1">
            Manajemen warung serba bisa
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 animate-slide-up">
          <h2 className="text-lg font-bold text-surface-800 mb-1">
            Selamat Datang
          </h2>
          <p className="text-surface-500 text-sm mb-6">
            Masuk untuk mengelola warung Anda
          </p>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-surface-400 mt-6">
          Dengan masuk, Anda menyetujui syarat & ketentuan penggunaan
        </p>
      </div>
    </div>
  );
}
