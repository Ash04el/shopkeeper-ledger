import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types";

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

const waMeUrl = (phone: string, name: string, amount: number) => {
  const text = `سلام سي ${name}، تذكير بسيط بالمبلغ المتبقي فالمحل (${amount} درهم). شكراً ليك!`;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
};

export const dynamic = "force-dynamic";

export default async function CustomerHistoryPage({
  params,
}: CustomerHistoryPageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the customer (must belong to the auth user)
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name, phone, note, created_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (customerError || !customer) {
    redirect("/dashboard");
  }

  // Fetch transaction history
  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, customer_id, user_id, amount, type, description, created_at")
    .eq("customer_id", params.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const txList = (transactions ?? []) as Transaction[];

  const balance = txList.reduce((acc, t) => {
    return acc + (t.type === "credit" ? Number(t.amount) : -Number(t.amount));
  }, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                aria-label="رجع للواجهة"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
              <h1 className="text-lg font-bold text-gray-900">
                {customer.name}
              </h1>
            </div>
            {customer.phone && (
              <a
                href={waMeUrl(customer.phone, customer.name, balance)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white transition hover:bg-green-600"
                aria-label={`صيفط رسالة واتساب لـ ${customer.name}`}
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            )}
          </div>
        </header>

        {/* Balance card */}
        <div className="px-4 pt-4">
          <div
            className={`rounded-2xl p-5 text-center shadow-sm ${
              balance > 0
                ? "bg-red-50 border border-red-100"
                : "bg-white border border-gray-100"
            }`}
          >
            <p className="text-sm font-medium text-gray-500">
              المبلغ المتبقي
            </p>
            <p
              className={`mt-1 text-3xl font-bold ${
                balance > 0
                  ? "text-red-600"
                  : balance < 0
                  ? "text-emerald-600"
                  : "text-gray-900"
              }`}
            >
              {balance > 0
                ? `${formatAmount(balance)} درهم`
                : balance < 0
                ? `+${formatAmount(Math.abs(balance))} درهم`
                : "0 درهم"}
            </p>
            {customer.phone && (
              <p dir="ltr" className="mt-1 text-xs text-gray-400">
                {customer.phone}
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        {customer.note && (
          <div className="px-4 pt-3">
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 border border-amber-100">
              📝 {customer.note}
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="px-4 pb-24 pt-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">
            الحركات ({txList.length})
          </h2>

          {txList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
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
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                          tx.type === "credit"
                            ? "bg-red-100"
                            : "bg-emerald-100"
                        }`}
                      >
                        {tx.type === "credit" ? "🧾" : "💵"}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {tx.type === "credit" ? "كريدي" : "خلاص"}
                        </p>
                        {tx.description && (
                          <p className="text-sm text-gray-500">{tx.description}</p>
                        )}
                        <p className="text-xs text-gray-400" dir="rtl">
                          {formatDate(tx.created_at)} - {formatTime(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-lg font-bold ${
                        tx.type === "credit"
                          ? "text-red-600"
                          : "text-emerald-600"
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