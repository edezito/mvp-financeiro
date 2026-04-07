"use client";

import { usePortfolioStore } from "@/contexts/portfolioStore";
import { formatCurrency } from "@/lib/utils";
import { SectionSpinner } from "@/components/ui/Spinner";
import { Trash2 } from "lucide-react";
import type { Asset } from "@/lib/types";

interface Props {
  limit?: number;
  showDelete?: boolean;
}

export function AssetTable({ limit, showDelete = true }: Props) {
  const { assets, loading, deleteAsset } = usePortfolioStore();

  if (loading && assets.length === 0) return <SectionSpinner />;

  const items = limit ? assets.slice(0, limit) : assets;

  if (items.length === 0) {
    return (
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 text-center">
        <p className="text-sm text-gray-400">Nenhum ativo na carteira ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">Ticker</th>
            <th className="px-4 py-3 text-left">Nome</th>
            <th className="px-4 py-3 text-right">Quantidade</th>
            <th className="px-4 py-3 text-right">Preço Médio</th>
            <th className="px-4 py-3 text-right">Total Investido</th>
            {showDelete && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((asset: Asset) => (
            <tr key={asset.id} className="bg-white transition hover:bg-gray-50">
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold tracking-widest text-indigo-700">
                  {asset.ticker}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {asset.name ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">
                {parseFloat(asset.quantity).toLocaleString("pt-BR", {
                  maximumFractionDigits: 6,
                })}
              </td>
              <td className="px-4 py-3 text-right text-gray-700">
                {formatCurrency(asset.avg_price)}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                {formatCurrency(asset.total_invested)}
              </td>
              {showDelete && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteAsset(asset.id)}
                    className="rounded p-1 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                    title="Remover ativo"
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
