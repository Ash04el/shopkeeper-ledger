import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CreditCard, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Transaction, ReminderLog } from "@/lib/types";
import ReminderButton from "@/components/ReminderButton";
import ArchiveCustomerButton from "@/components/ArchiveCustomerButton";
import CustomerQuickActions from "@/components/CustomerQuickActions";

interface CustomerHistoryPageProps {
  params: { id: string };
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ar-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("ar-MA", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Returns a human-readable relative time string in Darija */
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "دابا";
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  return `منذ ${diffDays} يوم`;
}

export const dynamic = "force-dynamic";

export default async function CustomerHistoryPage({
  params,
}: CustomerHistoryPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the customer (must belong to the auth user)
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name, phone, note, is_archived, created_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (customerError || !customer) {
    redirect("/dashboard");
  }

  // Fetch transaction history
  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, customer_id, user_id, amount, type, description, category, article_name, created_at")
    .eq("customer_id", params.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const txList = (transactions ?? []) as Transaction[];

  const balance = txList.reduce((acc, t) => {
    return acc + (t.type === "credit" ? Number(t.amount) : -Number(t.amount));
  }, 0);

  // Fetch reminders log for this customer
  const { data: remindersData } = await supabase
    .from("reminders_log")
    .select("id, customer_id, user_id, balance_at_reminder, sent_at")
    .eq("customer_id", params.id)
    .eq("user_id", user.id)
    .order("sent_at", { ascending: false });

  const reminders = (remindersData ?? []) as ReminderLog[];
  const lastReminder = reminders.length > 0 ? reminders[0] : null;
  const totalReminders = reminders.length;

  return (
    <main className="min-h-screen bg-[#F8F9FF] pb-28">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                aria-label="رجع للواجهة"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {customer.name}
                </h1>
                {customer.is_archived && (
                  <span className="text-xs font-medium text-amber-600">
                    📦 مؤرشف
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Large Prominent Balance Display Card */}
        <div className="px-4 pt-6">
          <div
            className={`rounded-3xl p-6 text-center shadow-sm border ${
              balance > 0
                ? "bg-[#EF4444]/10 border-[#EF4444]/30"
                : balance < 0
                ? "bg-[#10B981]/10 border-[#10B981]/30"
                : "bg-white border-slate-100"
            }`}
          >
            <p className="text-sm font-semibold text-gray-500">
              المبلغ المتبقي
            </p>
            <p
              className={`mt-2 text-4xl font-extrabold amount-number ${
                balance > 0
                  ? "text-[#EF4444]"
                  : balance < 0
                  ? "text-[#10B981]"
                  : "text-gray-900"
              }`}
            >
              {balance > 0
                ? `${formatAmount(balance)} درهم`
                : balance < 0
                ? `+${formatAmount(Math.abs(balance))} درهم`
                : "0 درهم"}
            </p>
            {balance > 0 && (
              <p className="mt-1 text-sm font-medium text-[#EF4444]/80">
                عليه ديْن
              </p>
            )}
            {balance < 0 && (
              <p className="mt-1 text-sm font-medium text-[#10B981]/80">
                عندو زيادة
              </p>
            )}
            {customer.phone && (
              <p dir="ltr" className="mt-2 text-xs text-gray-400">
                {customer.phone}
              </p>
            )}
            {customer.phone && !customer.is_archived && (
              <div className="mt-3 flex justify-center">
                <ReminderButton
                  customerId={customer.id}
                  phone={customer.phone}
                  name={customer.name}
                  balance={balance}
                />
              </div>
            )}
          </div>
        </div>

        {/* Quick-Actions Bar (WhatsApp, Call, PDF) */}
        {!customer.is_archived && (
          <CustomerQuickActions
            phone={customer.phone}
            name={customer.name}
            balance={balance}
          />
        )}

        {/* Notes */}
        {customer.note && (
          <div className="px-4 pt-3">
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 border border-amber-100">
              📝 {customer.note}
            </div>
          </div>
        )}

        {/* Last Reminder */}
        {lastReminder && (
          <div className="px-4 pt-3">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 border border-emerald-100">
              💬 آخر تذكير: {timeAgo(lastReminder.sent_at)}
              {totalReminders > 1 && ` (تذكير رقم ${totalReminders})`}
            </div>
          </div>
        )}

        {/* Full-Width Action Buttons */}
        {!customer.is_archived && (
          <div className="px-4 pt-6 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 mb-1">
              إجراءات سريعة
            </h3>

            {/* Add Debt (Red) */}
            <Link
              href={`/dashboard?tx_customer=${customer.id}`}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#DA3437] px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-[#C42E31] active:scale-[0.98]"
            >
              <CreditCard className="h-5 w-5" />
              إضافة كريدي
            </Link>

            {/* Add Payment (Green) */}
            <Link
              href={`/dashboard?tx_customer=${customer.id}`}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#10B981] px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Banknote className="h-5 w-5" />
              إضافة دفعة
            </Link>

            {/* Archive */}
            <div className="flex justify-center pt-1">
              <ArchiveCustomerButton
                customerId={customer.id}
                isArchived={customer.is_archived}
                variant="button"
              />
            </div>
          </div>
        )}

        {customer.is_archived && (
          <div className="px-4 pt-6 flex justify-center">
            <ArchiveCustomerButton
              customerId={customer.id}
              isArchived={customer.is_archived}
              variant="button"
            />
          </div>
        )}

        {/* Transactions */}
        <div className="px-4 pt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">
            الحركات ({txList.length})
          </h2>

          {txList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <div className="mb-2 text-4xl">🧾</div>
              <p className="font-medium text-gray-700">مازال حتى حركة</p>
              <p className="mt-1 text-sm text-gray-500">
                هاد الزبون مازال ما عندو حتى كريدي ولا خلاص
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {txList.map((tx) => (
                <li
                  key={tx.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                          tx.type === "credit"
                            ? "bg-[#EF4444]/10"
                            : "bg-[#10B981]/10"
                        }`}
                      >
                        {tx.type === "credit" ? "🔴" : "🟢"}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {tx.type === "credit" ? "كريدي" : "خلاص"}
                        </p>
                        {tx.article_name && (
                          <p className="text-xs text-gray-500">
                            {tx.article_name}
                            {tx.category && (
                              <span className="ml-1 text-gray-400">
                                ({tx.category === "basic_groceries" ? "غذائية" : tx.category === "dairy_breakfast" ? "حليب" : tx.category === "beverages" ? "مشروبات" : tx.category === "vegetables_fruits" ? "خضار" : tx.category === "sweets_snacks" ? "سناكات" : tx.category === "cleaning" ? "نظافة" : tx.category === "baby" ? "أطفال" : tx.category === "services" ? "خدمات" : tx.category})
                              </span>
                            )}
                          </p>
                        )}
                        {tx.description && (
                          <p className="text-xs text-gray-400">{tx.description}</p>
                        )}
                        <p className="text-xs text-gray-400" dir="rtl">
                          {formatDate(tx.created_at)} - {formatTime(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-lg font-extrabold amount-number ${
                        tx.type === "credit"
                          ? "text-[#EF4444]"
                          : "text-[#10B981]"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}
                      {formatAmount(Number(tx.amount))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}