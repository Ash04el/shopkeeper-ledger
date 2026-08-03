"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function LoginClient() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!/^(\+212|00212|0)?[5-7]\d{8}$/.test(phone.trim())) {
      setError("رقم الهاتف ماشي صحيح. جرب بالصيغة: +2126XXXXXXXX");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "مشكل فالتسجيل");
        setLoading(false);
        return;
      }

      setStep("otp");
    } catch {
      setError("مشكل فالاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: otp.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "مشكل فالتأكيد");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("مشكل فالاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("phone");
    setOtp("");
    setError(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FF] px-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
            🏪
          </div>
          <h1 className="text-2xl font-bold text-gray-900">دفتر المحل</h1>
          <p className="mt-1 text-sm text-gray-500">
            دخل بسم الله، مرحبا بيك
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                رقم الهاتف ديالك
              </label>
              <input
                id="phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full rounded-2xl border border-gray-300 px-4 py-4 text-center text-lg text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-[#10B981] px-4 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "دخول"
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              غادي يصيفطو ليك كود بالتلفون
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <button
              type="button"
              onClick={handleBack}
              className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              رجع
            </button>

            <div>
              <label
                htmlFor="otp"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                الكود ديالك
              </label>
              <input
                id="otp"
                type="text"
                dir="ltr"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full rounded-2xl border border-gray-300 px-4 py-4 text-center text-2xl tracking-[0.5em] text-gray-900 placeholder:text-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-[#10B981] px-4 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "تأكيد"
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}