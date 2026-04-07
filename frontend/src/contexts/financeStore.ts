import { create } from "zustand";
import api from "@/lib/api";
import type {
  Transaction,
  BalanceResponse,
  TransactionCreatePayload,
} from "@/lib/types";

interface FinanceState {
  transactions: Transaction[];
  balance: BalanceResponse | null;
  total: number;
  loading: boolean;
  error: string | null;

  fetchTransactions: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  addTransaction: (payload: TransactionCreatePayload) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  balance: null,
  total: 0,
  loading: false,
  error: null,

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get("/api/v1/finance/transactions");
      set({ transactions: data.transactions, total: data.total });
    } catch (err: any) {
      set({ error: err.response?.data?.detail ?? "Erro ao buscar transações." });
    } finally {
      set({ loading: false });
    }
  },

  fetchBalance: async () => {
    try {
      const { data } = await api.get("/api/v1/finance/balance");
      set({ balance: data });
    } catch (err: any) {
      set({ error: err.response?.data?.detail ?? "Erro ao buscar saldo." });
    }
  },

  addTransaction: async (payload) => {
    set({ loading: true, error: null });
    try {
      await api.post("/api/v1/finance/transactions", payload);
      // Atualiza lista e saldo em paralelo
      await Promise.all([get().fetchTransactions(), get().fetchBalance()]);
    } catch (err: any) {
      set({ error: err.response?.data?.detail ?? "Erro ao adicionar transação." });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteTransaction: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/v1/finance/transactions/${id}`);
      await Promise.all([get().fetchTransactions(), get().fetchBalance()]);
    } catch (err: any) {
      set({ error: err.response?.data?.detail ?? "Erro ao remover transação." });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
