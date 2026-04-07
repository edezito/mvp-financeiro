"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BalanceSummary } from "@/components/finance/BalanceSummary";
import { TransactionList } from "@/components/finance/TransactionList";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useFinanceStore } from "@/contexts/financeStore";
import { Plus, X } from "lucide-react";

export default function FinancePage() {
  const [showForm, setShowForm] = useState(false);
  const { fetchTransactions, fetchBalance } = useFinanceStore();

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header da página */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Finanças</h2>
            <p className="text-sm text-gray-500">
              Controle suas receitas e despesas
            </p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? (
              <><X className="h-4 w-4" /> Fechar</>
            ) : (
              <><Plus className="h-4 w-4" /> Nova Transação</>
            )}
          </Button>
        </div>

        {/* Cards de saldo */}
        <BalanceSummary />

        {/* Formulário */}
        {showForm && (
          <Card>
            <h3 className="mb-5 text-sm font-semibold text-gray-700">
              Adicionar nova transação
            </h3>
            <TransactionForm onSuccess={() => setShowForm(false)} />
          </Card>
        )}

        {/* Lista completa */}
        <Card>
          <h3 className="mb-5 text-sm font-semibold text-gray-700">
            Todas as Transações
          </h3>
          <TransactionList />
        </Card>
      </div>
    </AppLayout>
  );
}
