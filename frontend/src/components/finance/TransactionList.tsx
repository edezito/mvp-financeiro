"use client";

import { useFinanceStore } from "@/contexts/financeStore";
import { formatCurrency, formatDate, TRANSACTION_CATEGORY_LABELS } from "@/lib/utils";
import { SectionSpinner } from "@/components/ui/Spinner";
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface Props {
  limit?: number;
  showDelete?: boolean;
}

export function TransactionList({ limit, showDelete = true }: Props) {
  const { transactions, loading, deleteTransaction } = useFinanceStore();

  if (loading && transactions.length === 0) return <SectionSpinner />;

  const items = limit ? transactions.slice(0, limit) : transactions;

  if (items.length === 0) {
    return (
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 text-center">
        <p className="text-sm text-gray-400">Nenhuma transação registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">Tipo</th>
            <th className="px-4 py-3 text-left">Descrição</th>
            <th className="px-4 py-3 text-left">Categoria</th>
            <th className="px-4 py-3 text-left">Data</th>
            <th className="px-4 py-3 text-right">Valor</th>
            {showDelete && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((tx: Transaction) => (
            <tr key={tx.id} className="bg-white transition hover:bg-gray-50">
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    tx.type === "income"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  )}
                >
                  {tx.type === "income" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {tx.type === "income" ? "Receita" : "Despesa"}
                </span>
              </td>
              <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-900">
                {tx.description}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {TRANSACTION_CATEGORY_LABELS[tx.category] ?? tx.category}
              </td>
              <td className="px-4 py-3 text-gray-500">{formatDate(tx.date)}</td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-semibold",
                  tx.type === "income" ? "text-green-600" : "text-red-600"
                )}
              >
                {tx.type === "income" ? "+" : "-"}
                {formatCurrency(tx.amount)}
              </td>
              {showDelete && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="rounded p-1 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                    title="Excluir transação"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
