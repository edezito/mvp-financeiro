"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";
import type {
  EnrichedPortfolioResponse,
  MacroData,
  IpcaHistoryItem,
  DividendItem,
} from "@/lib/types";

interface B3StoreState {
  // Portfolio enriquecido com métricas
  portfolio: EnrichedPortfolioResponse | null;
  // Dados macroeconômicos (SELIC, IPCA)
  macro: MacroData | null;
  // Histórico mensal do IPCA
  ipcaHistory: IpcaHistoryItem[];
  // Dividendos por ticker
  dividends: Record<string, DividendItem[]>;

  // Loading states
  loading: boolean;
  loadingMacro: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  fetchPortfolio: () => Promise<void>;
  fetchMacro: () => Promise<void>;
  fetchIpcaHistory: (months?: number) => Promise<void>;
  fetchDividends: (ticker: string) => Promise<void>;
  fetchPortfolioDividends: () => Promise<void>;
  clearError: () => void;
}

export const useB3Store = create<B3StoreState>()(
  devtools(
    (set, get) => ({
      portfolio: null,
      macro: null,
      ipcaHistory: [],
      dividends: {},
      loading: false,
      loadingMacro: false,
      error: null,
      lastUpdated: null,

      fetchPortfolio: async () => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.get<EnrichedPortfolioResponse>(
            "/api/v1/b3/portfolio"
          );
          set({ portfolio: data, lastUpdated: new Date() });
        } catch (err: any) {
          set({
            error: err.response?.data?.detail ?? "Erro ao buscar portfólio B3.",
          });
        } finally {
          set({ loading: false });
        }
      },

      fetchMacro: async () => {
        set({ loadingMacro: true });
        try {
          const { data } = await api.get<MacroData>("/api/v1/b3/macro");
          set({ macro: data });
        } catch {
          // silencioso — macro é complementar
        } finally {
          set({ loadingMacro: false });
        }
      },

      fetchIpcaHistory: async (months = 12) => {
        try {
          const { data } = await api.get<IpcaHistoryItem[]>(
            `/api/v1/b3/macro/ipca-history?months=${months}`
          );
          set({ ipcaHistory: data });
        } catch {
          // silencioso
        }
      },

      fetchDividends: async (ticker: string) => {
        try {
          const { data } = await api.get<DividendItem[]>(
            `/api/v1/b3/dividends/${ticker.toUpperCase()}`
          );
          set((s) => ({
            dividends: {
              ...s.dividends,
              [ticker.toUpperCase()]: data,
            },
          }));
        } catch {
          // silencioso
        }
      },

      fetchPortfolioDividends: async () => {
        try {
          const { data } = await api.get<Record<string, DividendItem[]>>(
            "/api/v1/b3/dividends"
          );
          set({ dividends: data });
        } catch {
          // silencioso
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: "b3-store" }
  )
);