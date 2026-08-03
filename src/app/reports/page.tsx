"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowRight, TrendingUp, Users, CreditCard, Banknote, Loader2, BarChart3 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function ReportsPage() {
  const router = useRouter();

  const [analytics, setAnalytics] = useState<{
    total_active_customers: number;
    total_outstanding_credit: number;
    total_payments_all_time: number;
    active_debtors_count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        const row = Array.isArray(data.analytics) ? data.analytics[0] : null;
        if (row) {
          setAnalytics(row);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <main className="min-h-screen bg-[#F8F9FF] pb-24">
      <div className="mx-auto max-w-md">
        {/* Header */}
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
              <h1 className="text-lg font-bold text-gray-900">التقارير</h1>
            </div>
          </div>
        </header>

        <div className="px-4 pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : analytics ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-500">ملخص المحل</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-emerald-600" />
                      <p className="text-xs text-gray-500">الزبناء النشيطين</p>
                    </div>
                    <p className="mt-1 text-2xl font-extrabold text-gray-900">
                      {analytics.total_active_customers}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#EF4444]/10 p-3">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-[#EF4444]" />
                      <p className="text-xs text-gray-500">المبلغ لي باقي</p>
                    </div>
                    <p className="mt-1 text-2xl font-extrabold text-[#EF4444] amount-number">
                      {formatAmount(Number(analytics.total_outstanding_credit))}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                      <p className="text-xs text-gray-500">المدفوعات الكلية</p>
                    </div>
                    <p className="mt-1 text-2xl font-extrabold text-[#10B981] amount-number">
                      {formatAmount(Number(analytics.total_payments_all_time))}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                      <p className="text-xs text-gray-500">المديونين</p>
                    </div>
                    <p className="mt-1 text-2xl font-extrabold text-amber-600">
                      {analytics.active_debtors_count}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <div className="mb-2 text-4xl">📊</div>
              <p className="font-medium text-gray-700">ماكين حتى تقرير</p>
              <p className="mt-1 text-sm text-gray-500">
                زيد زبناء ومعاملات باش تشوف التقارير
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}