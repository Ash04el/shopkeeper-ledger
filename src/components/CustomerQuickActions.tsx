"use client";

import { MessageCircle, Phone, FileText } from "lucide-react";

interface CustomerQuickActionsProps {
  phone: string | null;
  name: string;
  balance: number;
}

/** Normalize a phone number to WhatsApp international format */
function toWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("212")) return `+${digits}`;
  if (digits.startsWith("00212")) return `+212${digits.slice(5)}`;
  if (digits.startsWith("0")) return `+212${digits.slice(1)}`;
  return `+${digits}`;
}

function normalizeForTel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `+${digits.startsWith("212") ? digits : "212" + digits.replace(/^0+/, "")}`;
}

export default function CustomerQuickActions({
  phone,
  name,
  balance,
}: CustomerQuickActionsProps) {
  const handleWhatsApp = () => {
    if (!phone) return;
    const waPhone = toWhatsAppPhone(phone);
    const text = encodeURIComponent(
      `السلام عليكم ${name}، كينـذكرك برصيد الكريدي: ${balance} درهم. مرحبا بيك.`
    );
    window.open(
      `https://wa.me/${waPhone}?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handlePdfReport = () => {
    window.print();
  };

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-1 no-scrollbar">
      {/* WhatsApp Reminder */}
      {phone && (
        <button
          onClick={handleWhatsApp}
          className="flex shrink-0 items-center gap-2 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/10 px-4 py-3 text-sm font-semibold text-[#128C7E] transition-all duration-150 hover:bg-[#25D366]/20 active:scale-[0.98] active:shadow-none"
        >
          <MessageCircle className="h-4 w-4" />
          تذكير واتساب
        </button>
      )}

      {/* Quick Call */}
      {phone && (
        <a
          href={`tel:${normalizeForTel(phone)}`}
          className="flex shrink-0 items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition-all duration-150 hover:bg-blue-100 active:scale-[0.98] active:shadow-none"
        >
          <Phone className="h-4 w-4" />
          اتصال سريع
        </a>
      )}

      {/* PDF Report (Print) */}
      <button
        onClick={handlePdfReport}
        className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition-all duration-150 hover:bg-gray-50 active:scale-[0.98] active:shadow-none"
      >
        <FileText className="h-4 w-4" />
        تقرير PDF
      </button>
    </div>
  );
}