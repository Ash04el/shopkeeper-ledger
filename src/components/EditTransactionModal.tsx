"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, Send } from "lucide-react";
import type { Transaction, TransactionType } from "@/lib/types";

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

type CategoryId = (typeof CATEGORIES)[number]["id"];

interface EditTransactionModalProps {
  transaction: Transaction;
  customerName: string;
  customerPhone: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

/** Normalize a phone number to WhatsApp international format */
function toWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("212")) return `+${digits}`;
  if (digits.startsWith("00212")) return `+212${digits.slice(5)}`;
  if (digits.startsWith("0")) return `+212${digits.slice(1)}`;
  return `+${digits}`;
}

export default function EditTransactionModal({
  transaction,
  customerName,
  customerPhone,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const [txType, setTxType] = useState<TransactionType>(transaction.type);
  const [txAmount, setTxAmount] = useState(String(transaction.amount));
  const [txDescription, setTxDescription] = useState(transaction.description ?? "");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(
    (transaction.category as CategoryId) ?? null
  );
  const [articleName, setArticleName] = useState(transaction.article_name ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isCredit = txType === "credit";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(txAmount);
    if (!txAmount || isNaN(amountNum) || amountNum <= 0) {
      setError("المبلغ خاصو يكون رقم موجب");
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          type: txType,
          description: txDescription.trim() || undefined,
          category: txType === "credit" ? (selectedCategory ?? undefined) : undefined,
          article_name: txType === "credit" ? (articleName.trim() || undefined) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "فشل فالتعديل");
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

  const handleSendWhatsApp = () => {
    if (!customerPhone) return;
    const waPhone = toWhatsAppPhone(customerPhone);
    const text = encodeURIComponent(
      `السلام عليكم ${customerName}، عندي تحديث على المعاملة:\n` +
      `النوع: ${txType === "credit" ? "كريدي" : "خلاص"}\n` +
      `المبلغ: ${txAmount} درهم` +
      (txDescription ? `\nملاحظة: ${txDescription}` : "") +
      `\nمرحبا بيك.`
    );
    window.open(
      `https://wa.me/${waPhone}?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

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
            تعديل المعاملة
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
              className={`rounded-2xl px-4 py-4 text-base font-bold shadow-md transition ${
                isCredit
                  ? "bg-[#DA3437] text-white ring-2 ring-red-300"
                  : "bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20"
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
              className={`rounded-2xl px-4 py-4 text-base font-bold shadow-md transition ${
                !isCredit
                  ? "bg-[#10B981] text-white ring-2 ring-emerald-300"
                  : "bg-[#10B981]/10 text-emerald-700 hover:bg-[#10B981]/20"
              }`}
            >
              🟢 خلاص
            </button>
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
                    className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-xs font-medium transition ${
                      selectedCategory === cat.id
                        ? "bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-[#EF4444]/20 hover:bg-[#EF4444]/5"
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
                htmlFor="edit-article"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                اسم السلعة / المنتج (اختياري)
              </label>
              <input
                id="edit-article"
                type="text"
                value={articleName}
                onChange={(e) => setArticleName(e.target.value)}
                placeholder="مثلاً: حليب، خبز..."
                className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              {categorySuggestions[selectedCategory] &&
                articleName.length === 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {categorySuggestions[selectedCategory]!.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setArticleName(suggestion)}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-[#EF4444]/30 hover:bg-[#EF4444]/5 hover:text-[#EF4444]"
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
              htmlFor="edit-amount"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              المبلغ (درهم)
            </label>
            <input
              id="edit-amount"
              type="number"
              inputMode="decimal"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              placeholder="0.00"
              dir="ltr"
              step="0.01"
              min="0.01"
              className="w-full rounded-2xl border border-gray-300 px-4 py-4 text-center text-3xl font-extrabold text-gray-900 placeholder:text-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 amount-number"
            />
          </div>

          {/* Description (Note) */}
          <div>
            <label
              htmlFor="edit-description"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              ملاحظة (اختياري)
            </label>
            <input
              id="edit-description"
              type="text"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              placeholder="شرا خبز وحليب"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
              تعدلات المعاملة بنجاح!
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-2xl bg-[#10B981] px-4 py-4 text-lg font-bold text-white transition-all duration-150 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "حفظ التعديلات"
            )}
          </button>

          {/* WhatsApp Notification */}
          {customerPhone && (
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-3 text-sm font-semibold text-[#128C7E] transition-all duration-150 hover:bg-[#25D366]/20 active:scale-[0.98]"
            >
              <Send className="h-4 w-4" />
              صيفط التحديث عبر واتساب
            </button>
          )}
        </form>
      </div>
    </div>
  );
}