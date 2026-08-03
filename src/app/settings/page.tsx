"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, Loader2, Settings } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function SettingsPage() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

  const handleSignout = async () => {
    setSigningOut(true);
    try {
      await fetch("/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
      setShowSignoutConfirm(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F9FF] pb-24">
      <div className="mx-auto max-w-md">
        <header className="sticky top-0 z-10 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                aria-label="رجع"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">الإعدادات</h1>
            </div>
          </div>
        </header>

        <div className="px-4 pt-6 space-y-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-500">الحساب</h3>
            <button
              onClick={() => setShowSignoutConfirm(true)}
              disabled={signingOut}
              className="flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-bold text-red-700 transition-all duration-150 hover:bg-red-100 active:scale-[0.98] disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              تسجيل الخروج
            </button>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-500">حول التطبيق</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Settings className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">دفتر المحل v1.0</p>
                <p className="text-xs text-gray-400">تطبيق تسجيل الكريدي والمدفوعات</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />

      {showSignoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <p className="mb-2 text-center text-lg font-bold text-gray-900">
              واش متأكد بغيتي تخرج؟
            </p>
            <p className="mb-6 text-center text-sm text-gray-500">
              غادي تخرج من الحساب وترجع لصفحة الدخول
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowSignoutConfirm(false)}
                disabled={signingOut}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                لا، بقى
              </button>
              <button
                onClick={handleSignout}
                disabled={signingOut}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {signingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "نعم، خرج"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}