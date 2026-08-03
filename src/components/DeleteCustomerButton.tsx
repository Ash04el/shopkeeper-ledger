"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface DeleteCustomerButtonProps {
  customerId: string;
  customerName: string;
}

export default function DeleteCustomerButton({
  customerId,
  customerName,
}: DeleteCustomerButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setShowConfirm(false);
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-all duration-150 hover:bg-red-50 active:scale-[0.98] active:shadow-none"
      >
        <Trash2 className="h-4 w-4" />
        حذف زبون
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <p className="mb-2 text-center text-lg font-bold text-gray-900">
              حذف {customerName}؟
            </p>
            <p className="mb-6 text-center text-sm text-gray-500">
              غادي تحيد الزبون نهائياً مع جميع المعاملات والديون. هاد الإجراء ما يمكنش الرجوع فيه.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                لا، تراجع
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    نعم، حيد
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}