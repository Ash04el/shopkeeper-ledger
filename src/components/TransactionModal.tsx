"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import type { CustomerWithBalance, TransactionType } from "@/lib/types";

const CATEGORIES = [
  { id: "basic_groceries", label: "المواد الغذائية الأساسية", hint: "سُكّر، دقيق، زيت...", emoji: "🛒" },
  { id: "dairy_breakfast", label: "الحليب ومستلزمات الصباح", hint: "حليب، فرماج، أتاي...", emoji: "🥛" },
  { id: "beverages", label: "المشروبات والماء", hint: "ماء، عصائر، صودا", emoji: "🥤" },
  { id: "vegetables_fruits", label: "الخضار والفواكه", hint: "بطاطا، بصل، مطيشة...", emoji: "🥕" },
  { id: "sweets_snacks", label: "الحلويات والسناكات", hint: "بيمو، سقاطة، شكلاط", emoji: "🍬" },
  { id: "cleaning", label: "مواد النظافة والتنظيف", hint: "جافيل، أومين، صابون", emoji: "🧹" },
  { id: "baby", label: "مستلزمات الأطفال", hint: "كوش، حليب الرضع", emoji: "👶" },
  { id: "services", label: "خدمات إضافية", hint: "روشارج، خدمات أخرى", emoji: "🔌" },
] as const;

type Category = (typeof CATEGORIES)[number];
type CategoryId = Category["id"];

interface TransactionModalProps {
  customers: CustomerWithBalance[];
  prefillCustomerId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function TransactionModal({
  customers,
  prefillCustomerId,
  onClose,
  onSuccess,
}: TransactionModalProps) {
  const [txCustomerId, setTxCustomerId] = useState(prefillCustomerId ?? "");
  const [txType, setTxType] = useState<TransactionType | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");

  // Category + article state (only for credit)
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [articleName, setArticleName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!txCustomerId) {
      setError("اختار الزبون");
      return;
    }

    if (!txType) {
      setError("اختار النوع (كريدي ولا خلاص)");
      return;
    }

    const amountNum = parseFloat(txAmount);
    if (!txAmount || isNaN(amountNum) || amountNum <= 0) {
      setError("المبلغ خاصو يكون رقم موجب");
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: txCustomerId,
          amount: amountNum,
          type: txType,
          description: txDescription.trim() || undefined,
          category: txType === "credit" ? (selectedCategory ?? undefined) : undefined,
          article_name:
            txType === "credit" ? (articleName.trim() || undefined) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "فشل فإضافة المعاملة");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setSubmitting(false);
    }
  };

  const isCredit = txType === "credit";
  const isPayment = txType === "payment";

  // Pre-select category chip hints for quick article name fill
  const categorySuggestions: Partial<Record<CategoryId, string[]>> = {
    basic_groceries: ["سُكّر", "دقيق", "زيت", "أرز", "عدس", "حمص"],
    dairy_breakfast: ["حليب", "فرماج", "أتاي", "قهوة", "خبز", "زبدة"],
    beverages: ["ماء", "عصير", "صودا", "شاي مثلج"],
    vegetables_fruits: ["بطاطا", "بصل", "مطيشة", "جزر", "خس"],
    sweets_snacks: ["بيمو", "سقاطة", "شكلاط", "بسكويت", "شيبس"],
    cleaning: ["جافيل", "أومين", "صابون", "شامبوان"],
    baby: ["كوش", "حليب الرضع", "بيبي كريم"],
    services: ["روشارج", "خدمة توصيل"],
  };

  const activeCustomers = customers.filter((c) => !c.is_archived);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
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
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            aria-label="سد"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTxType("credit");
                setError(null);
              }}
              className={`rounded-xl px-4 py-4 text-base font-bold shadow-md transition ${
                isCredit
                  ? "bg-red-600 text-white ring-2 ring-red-300"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              🔴 كريدي
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType("payment");
                setSelectedCategory(null);
                setArticleName("");
                setError(null);
              }}
              className={`rounded-xl px-4 py-4 text-base font-bold shadow-md transition ${
                isPayment
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              🟢 خلاص
            </button>
          </div>

          {/* Customer select */}
          <div>
            <label
              htmlFor="tm-customer"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              اختار الزبون
            </label>
            <select
              id="tm-customer"
              value={txCustomerId}
              onChange={(e) => setTxCustomerId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">...</option>
              {activeCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.balance !== 0 ? `(${formatAmount(c.balance)} درهم)` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Category grid — only for credit */}
          {isCredit && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                فئة المنتج (اختياري)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(
                        selectedCategory === cat.id ? null : cat.id
                      );
                    }}
                    className={`flex items-center gap-2 rounded-xl px-3 py-3 text-xs font-medium transition ${
                      selectedCategory === cat.id
                        ? "bg-red-100 border border-red-300 text-red-800"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50"
                    }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <div className="text-right">
                      <p>{cat.label}</p>
                      <p className="text-[10px] text-gray-400">{cat.hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Article name — only for credit */}
          {isCredit && selectedCategory && (
            <div>
              <label
                htmlFor="tm-article"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                اسم السلعة / المنتج (اختياري)
              </label>
              <input
                id="tm-article"
                type="text"
                value={articleName}
                onChange={(e) => setArticleName(e.target.value)}
                placeholder="مثلاً: حليب، خبز..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              {/* Quick-add chips based on selected category */}
              {categorySuggestions[selectedCategory] &&
                articleName.length === 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {categorySuggestions[selectedCategory]!.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setArticleName(suggestion)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label
              htmlFor="tm-amount"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              المبلغ (درهم)
            </label>
            <input
              id="tm-amount"
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

          {/* Description (Note) */}
          <div>
            <label
              htmlFor="tm-description"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              ملاحظة (اختياري)
            </label>
            <input
              id="tm-description"
              type="text"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              placeholder="شرا خبز وحليب"
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              تزادت المعاملة بنجاح!
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !txType}
            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "تأكيد المعاملة"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}