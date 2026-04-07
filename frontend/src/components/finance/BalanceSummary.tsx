"use client";

import { useFinanceStore } from "@/contexts/financeStore";
import { StatCard } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, Hash } from "lucide-react";

export function BalanceSummary() {
  const { balance } = useFinanceStore();

  const balanceNum = parseFloat(balance?.balance ?? "0");
  const income = balance?.total_income ?? "0";
  const expense = balance?.total_expense ?? "0";
  const count = balance?.transaction_count ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Saldo Atual"
        value={formatCurrency(balance?.balance ?? "0")}
        icon={Wallet}
        trend={balanceNum >= 0 ? "up" : "down"}
        iconColor={balanceNum >= 0 ? "text-brand-600" : "text-red-600"}
        iconBg={balanceNum >= 0 ? "bg-brand-50" : "bg-red-50"}
        subtitle="receitas - despesas"
      />
      <StatCard
        title="Total de Receitas"
        value={formatCurrency(income)}
        icon={TrendingUp}
        trend="up"
        iconColor="text-green-600"
        iconBg="bg-green-50"
      />
      <StatCard
        title="Total de Despesas"
        value={formatCurrency(expense)}
        icon={TrendingDown}
        trend="down"
        iconColor="text-red-600"
        iconBg="bg-red-50"
      />
      <StatCard
        title="Transações"
        value={String(count)}
        icon={Hash}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
        subtitle="registradas"
      />
    </div>
  );
}
