"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import type { CustomerWithBalance, TransactionType } from "@/lib/types";

interface DashboardClientProps {
  phone: string;
}

const MOROCCAN_PHONE_REGEX = /^(\+212|00212|0)?[5-7]\d{8}$/;

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Normalize a phone number to the WhatsApp international format (+212...) */
function toWhatsAppPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  // Remove leading zeros or country code prefixes, then prepend +212
  if (digits.startsWith("212")) return `+${digits}`;
  if (digits.startsWith("00212")) return `+212${digits.slice(5)}`;
  if (digits.startsWith("0")) return `+212${digits.slice(1)}`;
  return `+${digits}`;
}

function buildWhatsAppUrl(phone: string | null, customerName: string) {
  const waPhone = toWhatsAppPhone(phone);
  if (!waPhone) return null;
  const text = encodeURIComponent(
    `السلام ${customerName}، عافاك خاصك تخلص الحساب ديالك. مرحبا بيك.`
  );
  return `https://wa.me/${waPhone}?text=${text}`;
}

export default function DashboardClient({ phone }: DashboardClientProps) {
  const router = useRouter();

  // --- Data state ---
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // --- Modal state ---
  const [showModal, setShowModal] = useState<"customer" | "transaction" | null>(
    null
  );

  // --- Add Customer state ---
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [customerSubmitting, setCustomerSubmitting] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [customerSuccess, setCustomerSuccess] = useState(false);

  // --- Add Transaction state ---
  const [txCustomerId, setTxCustomerId] = useState("");
  const [txType, setTxType] = useState<TransactionType | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState(false);

  // --- Fetch customers ---
  const fetchCustomers = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "فشل في تحميل الزبناء");
      }
      const data = await res.json();
      setCustomers(data.customers ?? []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // --- Sign out ---
  const handleSignout = async () => {
    await fetch("/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // --- Add Customer ---
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerError(null);

    // Client-side validation
    if (!newName.trim()) {
      setCustomerError("السم ضروري");
      return;
    }

    if (newPhone.trim() && !MOROCCAN_PHONE_REGEX.test(newPhone.trim())) {
      setCustomerError("رقم الهاتف ماشي صحيح");
      return;
    }

    if (txSubmitting) return; // double-submit guard
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

      // Refresh customer list
      await fetchCustomers();

      // Close modal after a short delay so user sees success
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

  // --- Add Transaction ---
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);

    if (!txCustomerId) {
      setTxError("اختار الزبون");
      return;
    }

    if (!txType) {
      setTxError("اختار النوع (كريدي ولا خلاص)");
      return;
    }

    const amountNum = parseFloat(txAmount);
    if (!txAmount || isNaN(amountNum) || amountNum <= 0) {
      setTxError("المبلغ خاصو يكون رقم موجب");
      return;
    }

    if (txSubmitting) return; // double-submit guard
    setTxSubmitting(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: txCustomerId,
          amount: amountNum,
          type: txType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "فشل فإضافة المعاملة");
      }

      setTxSuccess(true);
      setTxCustomerId("");
      setTxType(null);
      setTxAmount("");

      // Refresh customer list to update balances
      await fetchCustomers();

      setTimeout(() => {
        setShowModal(null);
        setTxSuccess(false);
      }, 800);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setTxSubmitting(false);
    }
  };

  // --- Helper to open modals with reset ---
  const openCustomerModal = () => {
    setNewName("");
    setNewPhone("");
    setCustomerError(null);
    setCustomerSuccess(false);
    setShowModal("customer");
  };

  const openTransactionModal = () => {
    setTxCustomerId("");
    setTxType(null);
    setTxAmount("");
    setTxError(null);
    setTxSuccess(false);
    setShowModal("transaction");
  };

  // --- Compute metrics ---
  const totalCustomers = customers.length;
  const totalCredit = customers.reduce(
    (sum, c) => sum + (c.balance > 0 ? c.balance : 0),
    0
  );
  const totalTransactions = customers.reduce((sum, c) => {
    // We don't fetch individual transaction counts in the list API,
    // but we can count unique customers that have a non-zero balance
    // as an approximation. For a real metric we'd need a separate endpoint.
    // Using a placeholder derived from balance data:
    return sum + (c.balance !== 0 ? 1 : 0);
  }, 0);

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
              onClick={handleSignout}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="خروج"
            >
              <LogOut className="h-4 w-4" />
              خروج
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
                  totalCustomers
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

          {/* Customer List */}
          <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-500">
            الزبناء ديالك
          </h2>

          {fetchError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{fetchError}</p>
              <button
                onClick={fetchCustomers}
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

          {!fetching && !fetchError && customers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <div className="mb-2 text-4xl">📒</div>
              <p className="font-medium text-gray-700">تا زبون</p>
              <p className="mt-1 text-sm text-gray-500">
                زيد أول زبون ديالك باش تبدأ
              </p>
            </div>
          )}

          {!fetching && !fetchError && customers.length > 0 && (
            <div className="space-y-2">
              {customers.map((c) => {
                const waUrl = buildWhatsAppUrl(c.phone, c.name);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold text-gray-900">
                        {c.name}
                      </p>
                      {c.phone && (
                        <p
                          className="mt-0.5 text-xs text-gray-400"
                          dir="ltr"
                        >
                          {c.phone}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
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

                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition hover:bg-emerald-200 active:scale-95"
                          aria-label={`واتساب ${c.name}`}
                        >
                          <MessageCircle className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
                زيد كريدي / خلاص
              </h3>
              <button
                onClick={() => setShowModal(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                aria-label="سد"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType("credit")}
                  className={`rounded-xl px-4 py-4 text-base font-bold shadow-md transition ${
                    txType === "credit"
                      ? "bg-red-600 text-white ring-2 ring-red-300"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  🧾 كريدي (عليه)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("payment")}
                  className={`rounded-xl px-4 py-4 text-base font-bold shadow-md transition ${
                    txType === "payment"
                      ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  }`}
                >
                  💵 خلاص (عطى)
                </button>
              </div>

              {/* Customer select */}
              <div>
                <label
                  htmlFor="tx-customer"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  اختار الزبون
                </label>
                <select
                  id="tx-customer"
                  value={txCustomerId}
                  onChange={(e) => setTxCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.balance !== 0 ? `(${formatAmount(c.balance)} درهم)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label
                  htmlFor="tx-amount"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  المبلغ (درهم)
                </label>
                <input
                  id="tx-amount"
                  type="number"
                  inputMode="decimal"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  dir="ltr"
                  step="0.01"
                  min="0.01"
                  className="w-full rounded-xl border border-gray-300 px-4 py-4 text-center text-3xl font-bold text-gray-900 placeholder:text-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {txError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {txError}
                </p>
              )}

              {txSuccess && (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  تزادت المعاملة بنجاح!
                </p>
              )}

              <button
                type="submit"
                disabled={txSubmitting}
                className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
              >
                {txSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "تأكيد المعاملة"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}