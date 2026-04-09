// ---- Transactions ----
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

// ---- Assets ----
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

// ADICIONE ESTE TIPO AQUI 👇
export interface EnrichedAsset extends Asset {
  current_value: number;      // Valor atual do ativo
  gain_pct: number;           // Percentual de ganho
  real_pct: number;           // Percentual real
  weight_pct: number;         // Percentual de peso na carteira
  change_today_pct: number;   // Variação do dia em percentual
  current_price?: number;     // Preço atual (opcional)
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