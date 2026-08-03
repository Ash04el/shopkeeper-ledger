"use client";

import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";

interface ReminderButtonProps {
  customerId: string;
  phone: string;
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

export default function ReminderButton({
  customerId,
  phone,
  name,
  balance,
}: ReminderButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRemind = async () => {
    setLoading(true);
    try {
      // Log the reminder in the database
      await fetch(`/api/customers/${customerId}/remind`, {
        method: "POST",
      });
    } catch {
      // Silently ignore logging failures — still open WhatsApp
    }

    // Open WhatsApp with the pre-filled message
    const waPhone = toWhatsAppPhone(phone);
    const text = encodeURIComponent(
      `السلام ${name}، عافاك خاصك تخلص الحساب ديالك (${balance} درهم). مرحبا بيك.`
    );
    window.open(
      `https://wa.me/${waPhone}?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
    setLoading(false);
  };

  return (
    <button
      onClick={handleRemind}
      disabled={loading}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition hover:bg-emerald-200 active:scale-95 disabled:opacity-50"
      aria-label={`واتساب ${name}`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <MessageCircle className="h-5 w-5" />
      )}
    </button>
  );
}