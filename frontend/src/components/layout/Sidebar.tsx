"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BriefcaseBusiness,
  LogOut,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Finanças",
    href: "/finance",
    icon: ArrowLeftRight,
  },
  {
    label: "Portfólio",
    href: "/portfolio",
    icon: BriefcaseBusiness,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-gray-200 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-gray-900">MVP Financeiro</span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  active ? "text-brand-600" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {active && (
                <ChevronRight className="h-3 w-3 text-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé — usuário e logout */}
      <div className="border-t border-gray-200 px-3 py-4">
        <div className="mb-2 px-3">
          <p className="truncate text-xs font-medium text-gray-900">
            {user?.displayName ?? "Usuário"}
          </p>
          <p className="truncate text-xs text-gray-400">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
