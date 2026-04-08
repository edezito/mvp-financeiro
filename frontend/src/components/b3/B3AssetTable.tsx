"use client";

import { useState } from "react";
import { useB3Store } from "@/contexts/b3Store";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { SectionSpinner } from "@/components/ui/Spinner";
import type { EnrichedAsset } from "@/lib/types";

type SortKey = "ticker" | "gain_pct" | "real_pct" | "weight_pct" | "current_value" | "change_today_pct";

function GainBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const pos = value >= 0;
  return (
    <span
      className={cn(
        "inline-block rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        pos ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      )}
      aria-label={`${pos ? "+" : ""}${value.toFixed(2)}${suffix}`}
    >
      {pos ? "+" : ""}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}

interface ExpandedRowProps {
  asset: EnrichedAsset;
}

function ExpandedRow({ asset }: ExpandedRowProps) {
  return (
    <tr>
      <td colSpan={8} className="bg-gray-50 px-4 pb-4 pt-2">
        <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
          <div>
            <p className="text-gray-400">Preço médio de compra</p>
            <p className="font-semibold text-gray-800">{formatCurrency(asset.avg_price)}</p>
          </div>
          <div>
            <p className="text-gray-400">Preço atual</p>
            <p className="font-semibold text-gray-800">{formatCurrency(asset.current_price)}</p>
          </div>
          <div>
            <p className="text-gray-400">Custo total</p>
            <p className="font-semibold text-gray-800">{formatCurrency(asset.cost_basis)}</p>
          </div>
          <div>
            <p className="text-gray-400">Qtd. de ativos</p>
            <p className="font-semibold text-gray-800">
              {asset.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 6 })}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Resultado nominal</p>
            <p className={cn("font-semibold", asset.is_positive ? "text-green-700" : "text-red-700")}>
              {asset.is_positive ? "+" : ""}
              {formatCurrency(asset.gain_nominal)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Retorno real (Fisher)</p>
            <p className={cn("font-semibold", asset.real_pct >= 0 ? "text-emerald-700" : "text-orange-700")}>
              {asset.real_pct >= 0 ? "+" : ""}
              {asset.real_pct.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-gray-400">Variação hoje</p>
            <GainBadge value={asset.change_today_pct} />
          </div>
          <div>
            <p className="text-gray-400">Peso no portfólio</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(asset.weight_pct, 100)}%` }}
                />
              </div>
              <span className="font-semibold text-gray-700">{asset.weight_pct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function B3AssetTable() {
  const { portfolio, loading } = useB3Store();
  const [sortKey, setSortKey] = useState<SortKey>("gain_pct");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  if (loading && !portfolio) return <SectionSpinner />;
  if (!portfolio?.assets.length) {
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-gray-200">
        <p className="text-sm text-gray-400">Nenhum ativo com cotação disponível.</p>
      </div>
    );
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sorted = [...portfolio.assets].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortAsc ? cmp : -cmp;
  });

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortAsc ? <ChevronUp className="ml-0.5 inline h-3 w-3" /> : <ChevronDown className="ml-0.5 inline h-3 w-3" />
    ) : null;

  const TH = ({ k, children, right }: { k: SortKey; children: React.ReactNode; right?: boolean }) => (
    <th
      className={cn(
        "cursor-pointer select-none px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-800",
        right ? "text-right" : "text-left"
      )}
      onClick={() => handleSort(k)}
      aria-sort={sortKey === k ? (sortAsc ? "ascending" : "descending") : "none"}
    >
      {children}
      <SortIcon k={k} />
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200" role="table" aria-label="Ativos do portfólio">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <TH k="ticker">Ticker</TH>
            <TH k="current_value" right>Valor atual</TH>
            <TH k="gain_pct" right>Ganho %</TH>
            <TH k="real_pct" right>Retorno real</TH>
            <TH k="change_today_pct" right>Hoje</TH>
            <TH k="weight_pct" right>Peso</TH>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((asset) => {
            const expanded = expandedTicker === asset.ticker;
            return (
              <>
                <tr
                  key={asset.ticker}
                  className={cn(
                    "cursor-pointer transition hover:bg-gray-50",
                    expanded && "bg-gray-50"
                  )}
                  onClick={() => setExpandedTicker(expanded ? null : asset.ticker)}
                  aria-expanded={expanded}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tracking-widest",
                          asset.is_positive
                            ? "bg-green-50 text-green-800"
                            : "bg-red-50 text-red-800"
                        )}
                      >
                        {asset.ticker}
                      </span>
                      <span className="hidden max-w-[120px] truncate text-xs text-gray-400 sm:inline">
                        {asset.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(asset.current_value)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <GainBadge value={asset.gain_pct} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <GainBadge value={asset.real_pct} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <GainBadge value={asset.change_today_pct} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden h-1 w-16 rounded-full bg-gray-200 sm:block">
                        <div
                          className="h-1 rounded-full bg-indigo-400"
                          style={{ width: `${Math.min(asset.weight_pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{asset.weight_pct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <Info className="h-3.5 w-3.5" aria-hidden />
                  </td>
                </tr>
                {expanded && <ExpandedRow key={`${asset.ticker}-exp`} asset={asset} />}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
