// ─────────────────────────────────────────────
//  Transactions
// ─────────────────────────────────────────────

export type TransactionType = "income" | "expense";

export type TransactionCategory =
  | "salary"
  | "investment"
  | "freelance"
  | "food"
  | "transport"
  | "housing"
  | "health"
  | "education"
  | "entertainment"
  | "other";

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
}

export interface BalanceResponse {
  total_income: string;
  total_expense: string;
  balance: string;
  transaction_count: number;
}

export interface TransactionCreatePayload {
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  date: string;
}

// ─────────────────────────────────────────────
//  Assets (portfólio simples)
// ─────────────────────────────────────────────

export interface Asset {
  id: string;
  user_id: string;
  ticker: string;
  name: string | null;
  quantity: string;
  avg_price: string;
  total_invested: string;
  created_at: string;
  updated_at: string;
}

export interface EnrichedAsset extends Asset {
  current_price: number;
  current_value: number;
  cost_basis: number;
  gain_pct: number;
  gain_nominal: number;
  real_pct: number;
  weight_pct: number;
  change_today_pct: number;
  change_today_nom: number;
  is_positive: boolean;
  quote_available: boolean;
}

export interface AssetListResponse {
  assets: Asset[];
  total_invested: string;
  asset_count: number;
}

export interface AssetCreatePayload {
  ticker: string;
  name?: string;
  quantity: number;
  price: number;
}

// ─────────────────────────────────────────────
//  B3 — portfólio enriquecido
// ─────────────────────────────────────────────

export interface PortfolioSummary {
  total_invested: number;
  total_current_value: number;
  total_gain_nominal: number;
  total_gain_pct: number;
  total_real_pct: number;
  asset_count: number;
  is_positive: boolean;
}

export interface PortfolioRanking {
  top_winners: EnrichedAsset[];
  top_losers: EnrichedAsset[];
}

export interface EnrichedPortfolioResponse {
  assets: EnrichedAsset[];
  summary: PortfolioSummary;
  ranking: PortfolioRanking;
  macro?: MacroData;
}

// ─────────────────────────────────────────────
//  Macro — Banco Central
// ─────────────────────────────────────────────

export interface MacroData {
  selic_aa: number;
  ipca_12m: number;
  ipca_mes: number;
  real_yield_fisher: number;
  cached: boolean;
}

export interface IpcaHistoryItem {
  date: string;
  value: number;
}

// ─────────────────────────────────────────────
//  Dividendos
// ─────────────────────────────────────────────

export interface DividendItem {
  date: string;
  dividend_type: string;
  value: number;
}

// ─────────────────────────────────────────────
//  Gamificação
// ─────────────────────────────────────────────

export interface StreakBadge {
  icon: string;
  label: string;
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_points: number;
  last_activity_date: string | null;
  badge: StreakBadge | null;
  points_earned: number;
}

export interface InvestmentGoal {
  id: string;
  title: string;
  emoji: string;
  target_value: number;
  current_value: number;
  progress_pct: number;
  monthly_contribution: number;
  deadline: string | null;
  created_at: string;
  completed: boolean;
}

export interface GoalCreatePayload {
  title: string;
  emoji: string;
  target_value: number;
  current_value: number;
  monthly_contribution: number;
  deadline?: string;
}