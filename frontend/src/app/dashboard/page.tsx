"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { BalanceSummary } from "@/components/finance/BalanceSummary";
import { TransactionList } from "@/components/finance/TransactionList";
import { PortfolioSummary } from "@/components/portfolio/PortfolioSummary";
import { AssetTable } from "@/components/portfolio/AssetTable";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useFinanceStore } from "@/contexts/financeStore";
import { usePortfolioStore } from "@/contexts/portfolioStore";
import { Plus, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const [showTxForm, setShowTxForm] = useState(false);
  const { fetchTransactions, fetchBalance } = useFinanceStore();
  const { fetchAssets } = usePortfolioStore();

  // Carrega todos os dados ao montar
  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    fetchAssets();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Resumo financeiro */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">Resumo Financeiro</h2>
            <Button
              size="sm"
              onClick={() => setShowTxForm((v) => !v)}
            >
              <Plus className="h-4 w-4" />
              Nova Transação
            </Button>
          </div>

          <BalanceSummary />

          {showTxForm && (
            <Card className="mt-4">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">
                Adicionar Transação
              </h3>
              <TransactionForm onSuccess={() => setShowTxForm(false)} />
            </Card>
          )}
        </section>

        {/* Últimas transações */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">
              Últimas Transações
            </h2>
            <Link
              href="/finance"
              className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <TransactionList limit={5} showDelete={false} />
        </section>

        {/* Portfólio */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">
              Portfólio de Investimentos
            </h2>
            <Link
              href="/portfolio"
              className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
            >
              Ver carteira <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <PortfolioSummary />
          <div className="mt-4">
            <AssetTable limit={5} showDelete={false} />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
