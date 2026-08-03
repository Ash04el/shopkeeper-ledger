"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Users, BarChart3, Settings } from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "الرئيسية", href: "/dashboard", icon: Home },
  { id: "customers", label: "الزبناء", href: "/customers", icon: Users },
  { id: "reports", label: "التقارير", href: "/reports", icon: BarChart3 },
  { id: "settings", label: "الإعدادات", href: "/settings", icon: Settings },
] as const;

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname.startsWith("/dashboard")) return "home";
    if (pathname.startsWith("/customers")) return "customers";
    if (pathname.startsWith("/reports")) return "reports";
    if (pathname.startsWith("/settings")) return "settings";
    return "home";
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 right-0 left-0 z-30 border-t border-slate-100 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-1 transition-colors duration-150 ${
                isActive ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}