"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/finance": "Finanças",
  "/portfolio": "Portfólio",
};

export function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = pageTitles[pathname] ?? "MVP Financeiro";
  const initials = (user?.displayName ?? user?.email ?? "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}
