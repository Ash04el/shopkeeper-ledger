"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, AlertCircle, MessageCircle, MoreHorizontal, Users, Archive, Search } from "lucide-react";
import type { CustomerWithBalance } from "@/lib/types";
import ReminderButton from "@/components/ReminderButton";
import ArchiveCustomerButton from "@/components/ArchiveCustomerButton";
import BottomNav from "@/components/BottomNav";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function CustomersPage() {
  const router = useRouter();

  const [activeCustomers, setActiveCustomers] = useState<CustomerWithBalance[]>([]);
  const [archivedCustomers, setArchivedCustomers] = useState<CustomerWithBalance[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBoth = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const [activeRes, archivedRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/customers?archived=true"),
      ]);
      if (!activeRes.ok || !archivedRes.ok) {
        throw new Error("فشل في تحميل الزبناء");
      }
      const activeData = await activeRes.json();
      const archivedData = await archivedRes.json();
      setActiveCustomers(activeData.customers ?? []);
      setArchivedCustomers(archivedData.customers ?? []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchBoth();
  }, [fetchBoth]);

  const totalActive = activeCustomers.length;
  const totalArchived = archivedCustomers.length;

  const displayedCustomers = activeTab === "active" ? activeCustomers : archivedCustomers;

  const filteredCustomers = searchQuery.trim()
    ? displayedCustomers.filter(
        (c) =>
          c.name.includes(searchQuery.trim()) ||
          (c.phone && c.phone.includes(searchQuery.trim()))
      )
    : displayedCustomers;

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
              <h1 className="text-lg font-bold text-gray-900">الزبناء</h1>
            </div>
          </div>
        </header>

        <div className="px-4 pt-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالسم ولا رقم الهاتف..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pr-10 pl-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Tabs */}
          <div className="mb-4 flex rounded-2xl bg-gray-100 p-1">
            <button
              onClick={() => {
                setActiveTab("active");
                setOpenMenu(null);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                activeTab === "active"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="h-4 w-4" />
              النشيطين
              {!fetching && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  {totalActive}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("archived");
                setOpenMenu(null);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                activeTab === "archived"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Archive className="h-4 w-4" />
              الأرشيف
              {!fetching && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  {totalArchived}
                </span>
              )}
            </button>
          </div>

          {fetchError && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{fetchError}</p>
              <button
                onClick={fetchBoth}
                className="mr-auto rounded-xl bg-red-100 px-3 py-1 text-sm font-medium hover:bg-red-200"
              >
                حاول مرة أخرى
              </button>
            </div>
          )}

          {fetching && !fetchError && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          )}

          {!fetching && !fetchError && filteredCustomers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <div className="mb-2 text-4xl">📒</div>
              <p className="font-medium text-gray-700">
                {searchQuery ? "ما لقينا تا نتيجة" : activeTab === "archived" ? "تا زبون مؤرشف" : "تا زبون"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? "جرب تبدل الكلمة ولا ترجع للقائمة الكاملة"
                  : activeTab === "archived"
                  ? "مازال ما أرشفتي حتى زبون"
                  : "زيد أول زبون ديالك باش تبدأ"}
              </p>
            </div>
          )}

          {!fetching && !fetchError && filteredCustomers.length > 0 && (
            <div className="space-y-2">
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  className="relative flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-150 active:scale-[0.99]"
                >
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => router.push(`/customers/${c.id}`)}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-base font-bold text-gray-900">
                          {c.name}
                        </p>
                        {c.balance > 0 && (
                          <span className="shrink-0 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            مديون
                          </span>
                        )}
                      </div>
                      {c.phone && (
                        <p className="mt-0.5 text-xs text-gray-400" dir="ltr">
                          {c.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left" dir="ltr">
                      <p
                        className={`text-lg font-extrabold amount-number ${
                          c.balance > 0
                            ? "text-[#EF4444]"
                            : c.balance < 0
                              ? "text-[#10B981]"
                              : "text-gray-400"
                        }`}
                      >
                        {formatAmount(Math.abs(c.balance))}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400">
                        {c.balance > 0 ? "عليه" : c.balance < 0 ? "عندو زيادة" : "0"}
                      </p>
                    </div>

                    {c.phone && !c.is_archived && (
                      <ReminderButton
                        customerId={c.id}
                        phone={c.phone}
                        name={c.name}
                        balance={c.balance}
                      />
                    )}

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        aria-label="خيارات"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {openMenu === c.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-2xl border border-slate-100 bg-white py-1 shadow-lg">
                            <ArchiveCustomerButton
                              customerId={c.id}
                              isArchived={c.is_archived}
                            />
                            <button
                              onClick={() => {
                                setOpenMenu(null);
                                router.push(`/customers/${c.id}`);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
                            >
                              <MessageCircle className="h-4 w-4 text-emerald-500" />
                              التفاصيل
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}