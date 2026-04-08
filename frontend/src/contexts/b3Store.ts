"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface B3StoreState {
  // Portfolio data
  portfolio: {
    assets: any[];
    summary: any;
    ranking: any;
    macro: any;
  } | null;

  // Loading states
  loading: {
    portfolio: boolean;
    macro: boolean;
    ipcaHistory: boolean;
    dividends: boolean;
  };

  // Errors
  error: string | null;

  // Actions
  fetchPortfolio: () => Promise<void>;
  fetchMacro: () => Promise<void>;
  fetchIpcaHistory: (months: number) => Promise<void>;
  fetchPortfolioDividends: () => Promise<void>;
  clearError: () => void;
}

export const useB3Store = create<B3StoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      portfolio: null,
      loading: {
        portfolio: false,
        macro: false,
        ipcaHistory: false,
        dividends: false,
      },
      error: null,

      // Actions
      fetchPortfolio: async () => {
        set((state) => ({
          loading: { ...state.loading, portfolio: true },
          error: null
        }));

        try {
          const response = await fetch("/api/v1/b3/portfolio", {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("firebase_token")}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch portfolio");
          }

          const data = await response.json();
          set({ portfolio: data, loading: { ...get().loading, portfolio: false } });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            loading: { ...get().loading, portfolio: false }
          });
        }
      },

      fetchMacro: async () => {
        set((state) => ({
          loading: { ...state.loading, macro: true },
          error: null
        }));

        try {
          const response = await fetch("/api/v1/b3/macro", {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("firebase_token")}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch macro data");
          }

          const data = await response.json();
          set((state) => ({
            portfolio: state.portfolio ? { ...state.portfolio, macro: data } : null,
            loading: { ...get().loading, macro: false }
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            loading: { ...get().loading, macro: false }
          });
        }
      },

      fetchIpcaHistory: async (months: number) => {
        set((state) => ({
          loading: { ...state.loading, ipcaHistory: true },
          error: null
        }));

        try {
          const response = await fetch(`/api/v1/b3/macro/ipca-history?months=${months}`, {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("firebase_token")}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch IPCA history");
          }

          const data = await response.json();
          // Store in state if needed
          set({ loading: { ...get().loading, ipcaHistory: false } });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            loading: { ...get().loading, ipcaHistory: false }
          });
        }
      },

      fetchPortfolioDividends: async () => {
        set((state) => ({
          loading: { ...state.loading, dividends: true },
          error: null
        }));

        try {
          const response = await fetch("/api/v1/b3/dividends", {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("firebase_token")}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch dividends");
          }

          const data = await response.json();
          // Store in state if needed
          set({ loading: { ...get().loading, dividends: false } });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            loading: { ...get().loading, dividends: false }
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "b3-store",
    }
  )
);