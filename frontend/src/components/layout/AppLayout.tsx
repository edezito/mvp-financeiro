"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { FullPageSpinner } from "@/components/ui/Spinner";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useRequireAuth();

  if (loading) return <FullPageSpinner />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
