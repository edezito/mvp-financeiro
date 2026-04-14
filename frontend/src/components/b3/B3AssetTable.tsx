"use client";

import { useState, useCallback } from "react";
import { useB3Store } from "@/contexts/b3Store";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { SectionSpinner } from "@/components/ui/Spinner";
import api from "@/lib/api";
import type { EnrichedAsset } from "@/lib/types";
import type { MarketContext, MarketNewsItem, MarketSentiment } from "@/lib/types";

// ─────────────────────────────────────────────
//  Utilitários internos
// ─────────────────────────────────────────────

type SortKey =
  | "ticker"
  | "gain_pct"
  | "real_pct"
  | "weight_pct"
  | "current_value"
  | "change_today_pct";

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

function formatNewsDate(unixSeconds: number): string {
  if (!unixSeconds) return "";
  return new Date(unixSeconds * 1000).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

// ─────────────────────────────────────────────
//  Badge de Sentimento
// ─────────────────────────────────────────────

const SENTIMENT_CONFIG: Record<
  MarketSentiment,
  { icon: React.ElementType; label: string; badge: string; border: string; text: string }
> = {
  bullish: {
    icon: TrendingUp,
    label: "Alta (Bullish)",
    badge: "bg-green-100 text-green-800",
    border: "border-green-200",
    text: "text-green-700",
  },
  bearish: {
    icon: TrendingDown,
    label: "Baixa (Bearish)",
    badge: "bg-red-100 text-red-800",
    border: "border-red-200",
    text: "text-red-700",
  },
  neutral: {
    icon: Minus,
    label: "Neutro",
    badge: "bg-gray-100 text-gray-700",
    border: "border-gray-200",
    text: "text-gray-600",
  },
};

function SentimentBadge({ sentiment }: { sentiment: MarketSentiment }) {
  const cfg = SENTIMENT_CONFIG[sentiment];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        cfg.badge
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────
//  Card de notícia individual
// ─────────────────────────────────────────────

function NewsCard({ item, sentiment }: { item: MarketNewsItem; sentiment: MarketSentiment }) {
  const cfg = SENTIMENT_CONFIG[sentiment];
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex flex-col gap-1 rounded-lg border p-3 transition hover:shadow-sm",
        cfg.border,
        "bg-white hover:bg-gray-50"
      )}
      aria-label={`Abrir notícia: ${item.headline}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-gray-800 group-hover:underline">
          {item.headline}
        </p>
        <ExternalLink
          className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400 group-hover:text-gray-600"
          aria-hidden
        />
      </div>

      {item.summary && (
        <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
          {item.summary}
        </p>
      )}

      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
        {item.source && (
          <span className="font-medium text-gray-500">{item.source}</span>
        )}
        {item.source && item.datetime ? <span>·</span> : null}
        {item.datetime ? <span>{formatNewsDate(item.datetime)}</span> : null}
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────
//  Painel de contexto de mercado (accordion body)
// ─────────────────────────────────────────────

interface MarketContextPanelProps {
  context: MarketContext | null;
  isLoading: boolean;
  error: string | null;
}

function MarketContextPanel({ context, isLoading, error }: MarketContextPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Buscando notícias recentes…
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-2 text-xs text-red-500">
        Não foi possível carregar o contexto de mercado.
      </p>
    );
  }

  if (!context) return null;

  const cfg = SENTIMENT_CONFIG[context.sentiment];

  return (
    <div className="space-y-3">
      {/* Cabeçalho de sentimento */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Newspaper className={cn("h-4 w-4", cfg.text)} aria-hidden />
          <span className="text-xs font-semibold text-gray-700">
            Contexto de Mercado
          </span>
        </div>
        <SentimentBadge sentiment={context.sentiment} />
        {context.cached && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
            cache
          </span>
        )}
      </div>

      {/* Feed de notícias */}
      {context.news.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {context.news.map((item, idx) => (
            <NewsCard key={idx} item={item} sentiment={context.sentiment} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          Nenhuma notícia recente encontrada para este ativo.
        </p>
      )}

      {/* Rodapé da fonte */}
      {context.source === "finnhub" && (
        <p className="text-right text-xs text-gray-300">
          Fonte: Finnhub · últimos 7 dias
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Linha expandida (detalhes + contexto de mercado)
// ─────────────────────────────────────────────

interface ExpandedRowProps {
  asset: EnrichedAsset;
  context: MarketContext | null;
  isLoadingContext: boolean;
  contextError: string | null;
}

function ExpandedRow({
  asset,
  context,
  isLoadingContext,
  contextError,
}: ExpandedRowProps) {
  return (
    <tr>
      <td
        colSpan={8}
        className="bg-gray-50 px-4 pb-5 pt-3"
        role="region"
        aria-label={`Detalhes de ${asset.ticker}`}
      >
        {/* Grid de métricas existentes */}
        <div className="mb-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <p className="text-gray-400">Preço médio de compra</p>
            <p className="font-semibold text-gray-800">
              {formatCurrency(asset.avg_price)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Preço atual</p>
            <p className="font-semibold text-gray-800">
              {formatCurrency(asset.current_price)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Custo total</p>
            <p className="font-semibold text-gray-800">
              {formatCurrency(asset.cost_basis)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Qtd. de ativos</p>
            <p className="font-semibold text-gray-800">
              {Number(asset.quantity).toLocaleString("pt-BR", {
                maximumFractionDigits: 6,
              })}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Resultado nominal</p>
            <p
              className={cn(
                "font-semibold",
                asset.is_positive ? "text-green-700" : "text-red-700"
              )}
            >
              {asset.is_positive ? "+" : ""}
              {formatCurrency(asset.gain_nominal)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Retorno real (Fisher)</p>
            <p
              className={cn(
                "font-semibold",
                asset.real_pct >= 0 ? "text-emerald-700" : "text-orange-700"
              )}
            >
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
              <span className="font-semibold text-gray-700">
                {asset.weight_pct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div className="mb-3 border-t border-gray-200" />

        {/* Painel de contexto de mercado */}
        <MarketContextPanel
          context={context}
          isLoading={isLoadingContext}
          error={contextError}
        />
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
//  Tabela principal
// ─────────────────────────────────────────────

export function B3AssetTable() {
  const { portfolio, loading } = useB3Store();

  const [sortKey, setSortKey] = useState<SortKey>("gain_pct");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  // Cache local de contextos de mercado já buscados nesta sessão
  const [contextMap, setContextMap] = useState<Record<string, MarketContext>>({});
  const [loadingContextMap, setLoadingContextMap] = useState<Record<string, boolean>>({});
  const [errorContextMap, setErrorContextMap] = useState<Record<string, string | null>>({});

  // ── Fetch de contexto de mercado ──────────────────────────────────────────
  const fetchContext = useCallback(
    async (ticker: string) => {
      // Já está em cache local desta sessão — não rebusca
      if (contextMap[ticker]) return;

      setLoadingContextMap((prev) => ({ ...prev, [ticker]: true }));
      setErrorContextMap((prev) => ({ ...prev, [ticker]: null }));

      try {
        const { data } = await api.get<MarketContext>(
          `/api/market-context/${ticker}`
        );
        setContextMap((prev) => ({ ...prev, [ticker]: data }));
      } catch {
        setErrorContextMap((prev) => ({
          ...prev,
          [ticker]: "Erro ao carregar contexto.",
        }));
      } finally {
        setLoadingContextMap((prev) => ({ ...prev, [ticker]: false }));
      }
    },
    [contextMap]
  );

  // ── Toggle do accordion ───────────────────────────────────────────────────
  const handleRowClick = useCallback(
    (ticker: string) => {
      if (expandedTicker === ticker) {
        setExpandedTicker(null);
      } else {
        setExpandedTicker(ticker);
        fetchContext(ticker);
      }
    },
    [expandedTicker, fetchContext]
  );

  // ── Ordenação ─────────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  // ── Guarda-chuvas de renderização ─────────────────────────────────────────
  if (loading && !portfolio) return <SectionSpinner />;
  if (!portfolio?.assets.length) {
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-gray-200">
        <p className="text-sm text-gray-400">
          Nenhum ativo com cotação disponível.
        </p>
      </div>
    );
  }

  const sorted = [...portfolio.assets].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    const cmp =
      typeof av === "string"
        ? av.localeCompare(bv as string)
        : (av as number) - (bv as number);
    return sortAsc ? cmp : -cmp;
  });

  // ── Sub-componente de cabeçalho de coluna ordenável ───────────────────────
  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortAsc ? (
        <ChevronUp className="ml-0.5 inline h-3 w-3" />
      ) : (
        <ChevronDown className="ml-0.5 inline h-3 w-3" />
      )
    ) : null;

  const TH = ({
    k,
    children,
    right,
  }: {
    k: SortKey;
    children: React.ReactNode;
    right?: boolean;
  }) => (
    <th
      className={cn(
        "cursor-pointer select-none px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-800",
        right ? "text-right" : "text-left"
      )}
      onClick={() => handleSort(k)}
      aria-sort={
        sortKey === k ? (sortAsc ? "ascending" : "descending") : "none"
      }
    >
      {children}
      <SortIcon k={k} />
    </th>
  );

  // ── Renderização ──────────────────────────────────────────────────────────
  return (
    <div
      className="overflow-x-auto rounded-xl border border-gray-200"
      role="table"
      aria-label="Ativos do portfólio"
    >
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <TH k="ticker">Ticker</TH>
            <TH k="current_value" right>
              Valor atual
            </TH>
            <TH k="gain_pct" right>
              Ganho %
            </TH>
            <TH k="real_pct" right>
              Retorno real
            </TH>
            <th
              className="cursor-pointer select-none px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-800"
              onClick={() => handleSort("change_today_pct")}
              aria-sort={
                sortKey === "change_today_pct"
                  ? sortAsc
                    ? "ascending"
                    : "descending"
                  : "none"
              }
            >
              <span className="inline-flex items-center justify-end gap-1">
                Hoje
                <Newspaper
                  className="h-3 w-3 text-gray-400"
                  aria-label="Clique na linha para ver notícias"
                />
              </span>
              <SortIcon k="change_today_pct" />
            </th>
            <TH k="weight_pct" right>
              Peso
            </TH>
            {/* Coluna chevron */}
            <th className="w-8 px-4 py-3" aria-hidden />
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {sorted.map((asset) => {
            const expanded = expandedTicker === asset.ticker;

            return (
              <>
                {/* ── Linha principal do ativo ── */}
                <tr
                  key={asset.ticker}
                  className={cn(
                    "cursor-pointer transition hover:bg-gray-50",
                    expanded && "bg-gray-50"
                  )}
                  onClick={() => handleRowClick(asset.ticker)}
                  aria-expanded={expanded}
                  aria-label={`${expanded ? "Recolher" : "Expandir"} detalhes de ${asset.ticker}`}
                >
                  {/* Ticker + nome */}
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

                  {/* Valor atual */}
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(asset.current_value)}
                  </td>

                  {/* Ganho % */}
                  <td className="px-4 py-3 text-right">
                    <GainBadge value={asset.gain_pct} />
                  </td>

                  {/* Retorno real */}
                  <td className="px-4 py-3 text-right">
                    <GainBadge value={asset.real_pct} />
                  </td>

                  {/* Variação hoje + ícone de notícias */}
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <GainBadge value={asset.change_today_pct} />
                      {/* Indicador visual de contexto disponível */}
                      <Newspaper
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          expanded
                            ? "text-indigo-500"
                            : "text-gray-300 group-hover:text-gray-400"
                        )}
                        aria-hidden
                      />
                    </div>
                  </td>

                  {/* Peso */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden h-1 w-16 rounded-full bg-gray-200 sm:block">
                        <div
                          className="h-1 rounded-full bg-indigo-400"
                          style={{
                            width: `${Math.min(asset.weight_pct, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {asset.weight_pct.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Chevron */}
                  <td className="px-4 py-3 text-gray-400">
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" aria-hidden />
                    ) : (
                      <ChevronDown className="h-4 w-4" aria-hidden />
                    )}
                  </td>
                </tr>

                {/* ── Accordion: detalhes + contexto de mercado ── */}
                {expanded && (
                  <ExpandedRow
                    key={`${asset.ticker}-expanded`}
                    asset={asset}
                    context={contextMap[asset.ticker] ?? null}
                    isLoadingContext={loadingContextMap[asset.ticker] ?? false}
                    contextError={errorContextMap[asset.ticker] ?? null}
                  />
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}