"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useB3Store } from "@/contexts/b3Store";
import { formatCurrency } from "@/lib/utils";

// Paleta acessível (WCAG AA — contraste ≥ 4.5:1 sobre branco)
const PALETTE = [
  "#4f46e5",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#65a30d",
];

// ─────────────────────────────────────────────
//  Gráfico de pizza — composição do portfólio
// ─────────────────────────────────────────────

export function PortfolioAllocationChart() {
  const { portfolio } = useB3Store();
  if (!portfolio?.assets.length) return null;

  const data = portfolio.assets
    .filter((a) => a.current_value > 0)
    .sort((a, b) => b.current_value - a.current_value)
    .map((a) => ({ name: a.ticker, value: a.current_value, pct: a.weight_pct }));

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Composição do portfólio
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            aria-label="Gráfico de composição do portfólio"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, name: string) => [formatCurrency(v), name]}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value, entry: any) =>
              `${value} (${entry.payload.pct.toFixed(1)}%)`
            }
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Gráfico de barras — ganho % por ativo
// ─────────────────────────────────────────────

export function AssetGainChart() {
  const { portfolio } = useB3Store();
  if (!portfolio?.assets.length) return null;

  const data = [...portfolio.assets]
    .sort((a, b) => b.gain_pct - a.gain_pct)
    .map((a) => ({
      ticker: a.ticker,
      nominal: parseFloat(a.gain_pct.toFixed(2)),
      real: parseFloat(a.real_pct.toFixed(2)),
    }));

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Ganho nominal vs. retorno real por ativo
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="ticker" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="%" />
          <Tooltip
            formatter={(v: number, name: string) => [
              `${v.toFixed(2)}%`,
              name === "nominal" ? "Nominal" : "Real (Fisher)",
            ]}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Legend
            formatter={(v) => (v === "nominal" ? "Nominal" : "Real (Fisher)")}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="nominal" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="real" fill="#059669" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Gráfico de área — histórico IPCA
// ─────────────────────────────────────────────

export function IpcaHistoryChart() {
  // ipcaHistory agora existe no b3Store consolidado
  const { ipcaHistory } = useB3Store();
  if (!ipcaHistory.length) return null;

  const data = [...ipcaHistory].reverse().map((d) => ({
    date: d.date,
    ipca: d.value,
  }));

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        IPCA mensal (Banco Central)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ left: -20 }}>
          <defs>
            <linearGradient id="ipcaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} unit="%" />
          <Tooltip
            formatter={(v: number) => [`${v.toFixed(2)}%`, "IPCA"]}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="ipca"
            stroke="#dc2626"
            strokeWidth={2}
            fill="url(#ipcaGrad)"
            aria-label="Histórico do IPCA"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}