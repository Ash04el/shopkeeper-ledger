"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";

interface ArchiveCustomerButtonProps {
  customerId: string;
  isArchived: boolean;
  variant?: "icon" | "button";
}

export default function ArchiveCustomerButton({
  customerId,
  isArchived,
  variant = "button",
}: ArchiveCustomerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: !isArchived }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        aria-label={isArchived ? "إلغاء الأرشفة" : "أرشفة"}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isArchived ? (
          <ArchiveRestore className="h-4 w-4 text-emerald-500" />
        ) : (
          <Archive className="h-4 w-4 text-amber-500" />
        )}
        {isArchived ? "إلغاء الأرشفة" : "أرشفة"}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isArchived ? (
        <ArchiveRestore className="h-4 w-4 text-emerald-500" />
      ) : (
        <Archive className="h-4 w-4 text-amber-500" />
      )}
      {isArchived ? "إلغاء الأرشفة" : "أرشفة"}
    </button>
  );
}