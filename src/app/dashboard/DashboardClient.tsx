"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LogOut,
  Plus,
  Users,
  ArrowLeftRight,
  Wallet,
  X,
  Phone,
  Loader2,
  AlertCircle,
  MessageCircle,
  CheckCircle2,
  Contact,
  MoreHorizontal,
  Archive,
  TrendingUp,
  CreditCard,
  Banknote,
} from "lucide-react";
import type { CustomerWithBalance } from "@/lib/types";
import ReminderButton from "@/components/ReminderButton";
import ArchiveCustomerButton from "@/components/ArchiveCustomerButton";
import TransactionModal from "@/components/TransactionModal";

interface DashboardClientProps {
  phone: string;
}

const MOROCCAN_PHONE_REGEX = /^(\+212|00212|0)?[5-7]\d{8}$/;

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Normalize an imported contact phone number to Moroccan format */
function normalizeContactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("212")) return `+${digits}`;
  if (digits.startsWith("00212")) return `+212${digits.slice(5)}`;
  if (digits.length === 9 && (digits.startsWith("5") || digits.startsWith("6") || digits.startsWith("7"))) {
    return `0${digits}`;
  }
  return digits;
}

/** Feature-detect the Contact Picker API */
function isContactsApiSupported(): boolean {
  return "contacts" in navigator && "ContactsManager" in window;
}

export default function DashboardClient({ phone }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Data state ---
  const [activeCustomers, setActiveCustomers] = useState<CustomerWithBalance[]>([]);
  const [archivedCustomers, setArchivedCustomers] = useState<CustomerWithBalance[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // --- Analytics state ---
  const [analytics, setAnalytics] = useState<{
    total_active_customers: number;
    total_outstanding_credit: number;
    total_payments_all_time: number;
    active_debtors_count: number;
  } | null>(null);
  const [, setAnalyticsLoading] = useState(true);

  // --- Active tab ---
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // --- Open menu state (customer id whose dropdown is open) ---
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // --- Modal state ---
  const [showModal, setShowModal] = useState<"customer" | "transaction" | null>(
    null
  );

  // --- Sign out state ---
  const [signingOut, setSigningOut] = useState(false);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

  // --- Add Customer state ---
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [customerSubmitting, setCustomerSubmitting] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [customerSuccess, setCustomerSuccess] = useState(false);
  const [pickingContact, setPickingContact] = useState(false);

  // --- Pre-fill transaction customer ---
  const [prefillTxCustomer, setPrefillTxCustomer] = useState<string | undefined>(undefined);

  // --- Fetch both active and archived customers ---
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

  // --- Fetch analytics ---
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        // analytics is an array with one row from the function
        const row = Array.isArray(data.analytics) ? data.analytics[0] : null;
        if (row) {
          setAnalytics(row);
        }
      }
    } catch {
      // silently ignore
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoth();
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Pre-fill transaction from query param ---
  useEffect(() => {
    const prefillCustomer = searchParams.get("tx_customer");
    if (prefillCustomer) {
      setPrefillTxCustomer(prefillCustomer);
      setShowModal("transaction");
    }
  }, [searchParams]);

  // --- Sign out ---
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

  // --- Contact Picker ---
  const handlePickContact = async () => {
    setPickingContact(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      const contacts = await nav.contacts.select(
        ["name", "tel"],
        { multiple: false }
      );
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        if (contact.name && contact.name.length > 0) {
          setNewName(contact.name.join(" "));
        }
        if (contact.tel && contact.tel.length > 0) {
          setNewPhone(normalizeContactPhone(contact.tel[0]));
        }
      }
    } catch (err) {
      console.warn("Contact picker failed:", err);
    } finally {
      setPickingContact(false);
    }
  };

  // --- Add Customer ---
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerError(null);

    if (!newName.trim()) {
      setCustomerError("السم ضروري");
      return;
    }

    if (newPhone.trim() && !MOROCCAN_PHONE_REGEX.test(newPhone.trim())) {
      setCustomerError("رقم الهاتف ماشي صحيح");
      return;
    }

    if (customerSubmitting) return;
    setCustomerSubmitting(true);

    try {
      const res = await fetch("/api/customers/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "فشل فإضافة الزبون");
      }

      setCustomerSuccess(true);
      setNewName("");
      setNewPhone("");

      await fetchBoth();

      setTimeout(() => {
        setShowModal(null);
        setCustomerSuccess(false);
      }, 800);
    } catch (err) {
      setCustomerError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setCustomerSubmitting(false);
    }
  };

  // --- Transaction success handler ---
  const handleTransactionSuccess = async () => {
    setShowModal(null);
    setPrefillTxCustomer(undefined);
    await fetchBoth();
    await fetchAnalytics();
  };

  // --- Helpers to open modals with reset ---
  const openCustomerModal = () => {
    setNewName("");
    setNewPhone("");
    setCustomerError(null);
    setCustomerSuccess(false);
    setPickingContact(false);
    setShowModal("customer");
  };

  const openTransactionModal = () => {
    setPrefillTxCustomer(undefined);
    setShowModal("transaction");
  };

  // --- Compute metrics ---
  const totalActive = activeCustomers.length;
  const totalArchived = archivedCustomers.length;
  const totalCredit = activeCustomers.reduce(
    (sum, c) => sum + (c.balance > 0 ? c.balance : 0),
    0
  );
  const totalTransactions = activeCustomers.reduce((sum, c) => {
    return sum + (c.balance !== 0 ? 1 : 0);
  }, 0);

  const contactsSupported = isContactsApiSupported();

  // Customers to render based on active tab
  const displayedCustomers = activeTab === "active" ? activeCustomers : archivedCustomers;
  const allCustomersForModal = [...activeCustomers, ...archivedCustomers];


  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              <div>
                <h1 className="text-lg font-bold text-gray-900">دفتر المحل</h1>
                <p
                  className="flex items-center gap-1 text-xs text-gray-500"
                  dir="ltr"
                >
                  <Phone className="h-3 w-3" />
                  {phone}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSignoutConfirm(true)}
              disabled={signingOut}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
              aria-label="تسجيل الخروج"
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              تسجيل الخروج
            </button>
          </div>
        </header>

        <div className="px-4 pb-24 pt-4">
          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {fetching ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  totalActive
                )}
              </p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">
                الزبناء
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                <ArrowLeftRight className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {fetching ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  totalTransactions
                )}
              </p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">
                نشيطين
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {fetching ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  formatAmount(totalCredit)
                )}
              </p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">درهم</p>
            </div>
          </div>

          {/* Analytics Widget */}
          {analytics && activeTab === "active" && (
            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-500">
                  ملخص المحل
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                    <p className="text-xs text-gray-500">الزبناء النشيطين</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {analytics.total_active_customers}
                  </p>
                </div>
                <div className="rounded-xl bg-red-50 p-3">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-red-500" />
                    <p className="text-xs text-gray-500">المبلغ لي باقي</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-red-600">
                    {formatAmount(Number(analytics.total_outstanding_credit))}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <div className="flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                    <p className="text-xs text-gray-500">المدفوعات الكلية</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-emerald-600">
                    {formatAmount(Number(analytics.total_payments_all_time))}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    <p className="text-xs text-gray-500">المديونين</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-amber-600">
                    {analytics.active_debtors_count}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-500">
            إجراءات سريعة
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={openCustomerModal}
              className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Plus className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">
                زيد زبون
              </span>
            </button>

            <button
              onClick={openTransactionModal}
              className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <ArrowLeftRight className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">
                زيد معاملة
              </span>
            </button>
          </div>

          {/* Tabbed Customer List */}
          <div className="mb-3 mt-8">
            <div className="flex rounded-2xl bg-gray-100 p-1">
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
                الزبناء النشيطين
                {!fetching && (
                  <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
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
                  <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    {totalArchived}
                  </span>
                )}
              </button>
            </div>
          </div>

          {fetchError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{fetchError}</p>
              <button
                onClick={fetchBoth}
                className="mr-auto rounded-lg bg-red-100 px-3 py-1 text-sm font-medium hover:bg-red-200"
              >
                حاول مرة أخرى
              </button>
            </div>
          )}

          {fetching && !fetchError && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          )}

          {!fetching && !fetchError && displayedCustomers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <div className="mb-2 text-4xl">📒</div>
              <p className="font-medium text-gray-700">
                {activeTab === "archived" ? "تا زبون مؤرشف" : "تا زبون"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === "archived"
                  ? "مازال ما أرشفتي حتى زبون"
                  : "زيد أول زبون ديالك باش تبدأ"}
              </p>
            </div>
          )}

          {!fetching && !fetchError && displayedCustomers.length > 0 && (
            <div className="space-y-2">
              {displayedCustomers.map((c) => {
                return (
                  <div
                    key={c.id}
                    className="relative flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-base font-bold text-gray-900">
                          {c.name}
                        </p>
                        {activeTab === "archived" && (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            📦 مؤرشف
                          </span>
                        )}
                      </div>
                      {c.phone && (
                        <p
                          className="mt-0.5 text-xs text-gray-400"
                          dir="ltr"
                        >
                          {c.phone}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-left" dir="ltr">
                        <p
                          className={`text-lg font-extrabold ${
                            c.balance > 0
                              ? "text-red-600"
                              : c.balance < 0
                                ? "text-emerald-600"
                                : "text-gray-400"
                          }`}
                        >
                          {formatAmount(Math.abs(c.balance))}
                        </p>
                        <p className="text-[10px] font-medium text-gray-400">
                          {c.balance > 0
                            ? "عليه"
                            : c.balance < 0
                              ? "عندو زيادة"
                              : "0"}
                        </p>
                      </div>

                      {c.phone && activeTab === "active" && (
                        <ReminderButton
                          customerId={c.id}
                          phone={c.phone}
                          name={c.name}
                          balance={c.balance}
                        />
                      )}

                      {/* Active tab: dropdown menu. Archived tab: direct unarchive button */}
                      {activeTab === "active" ? (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenu(openMenu === c.id ? null : c.id)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                            aria-label="خيارات"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {openMenu === c.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenu(null)}
                              />
                              <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
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
                                  <MessageCircle className="h-4 w-4 text-blue-500" />
                                  التفاصيل
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <ArchiveCustomerButton
                          customerId={c.id}
                          isArchived={c.is_archived}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== Sign Out Confirmation Dialog ===== */}
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

      {/* ===== Add Customer Modal ===== */}
      {showModal === "customer" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setShowModal(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                زيد زبون جديد
              </h3>
              <button
                onClick={() => setShowModal(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                aria-label="سد"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              {/* Contact Picker button */}
              {contactsSupported ? (
                <button
                  type="button"
                  onClick={handlePickContact}
                  disabled={pickingContact}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                >
                  {pickingContact ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Contact className="h-4 w-4" />
                  )}
                  استورد من جهات الاتصال
                </button>
              ) : (
                <div className="group relative flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-medium text-gray-400">
                  <Contact className="h-4 w-4" />
                  استورد من جهات الاتصال
                  <span className="absolute -bottom-2 left-1/2 hidden -translate-x-1/2 translate-y-full rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white group-hover:block whitespace-nowrap">
                    غير متوفر فهاد المتصفح
                  </span>
                </div>
              )}

              <div>
                <label
                  htmlFor="cust-name"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  السم ديال الزبون *
                </label>
                <input
                  id="cust-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثلاً: محمد"
                  autoFocus
                  className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="cust-phone"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  رقم الهاتف (اختياري)
                </label>
                <input
                  id="cust-phone"
                  type="tel"
                  dir="ltr"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-center text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {customerError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {customerError}
                </p>
              )}

              {customerSuccess && (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  تزاد الزبون بنجاح!
                </p>
              )}

              <button
                type="submit"
                disabled={customerSubmitting}
                className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
              >
                {customerSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "تأكيد"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== Add Transaction Modal ===== */}
      {showModal === "transaction" && (
        <TransactionModal
          customers={allCustomersForModal}
          prefillCustomerId={prefillTxCustomer}
          onClose={() => {
            setShowModal(null);
            setPrefillTxCustomer(undefined);
          }}
          onSuccess={handleTransactionSuccess}
        />
      )}
    </main>
  );
}