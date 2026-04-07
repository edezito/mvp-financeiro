import { create } from "zustand";
import api from "@/lib/api";
import type { Asset, AssetListResponse, AssetCreatePayload } from "@/lib/types";

interface PortfolioState {
  assets: Asset[];
  totalInvested: string;
  assetCount: number;
  loading: boolean;
  error: string | null;

  fetchAssets: () => Promise<void>;
  addAsset: (payload: AssetCreatePayload) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  clearError: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  assets: [],
  totalInvested: "0",
  assetCount: 0,
  loading: false,
  error: null,

  fetchAssets: async () => {
    set({ loading: true, error: null });
    try {
      const { data }: { data: AssetListResponse } = await api.get(
        "/api/v1/portfolio/assets"
      );
      set({
        assets: data.assets,
        totalInvested: data.total_invested,
        assetCount: data.asset_count,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.detail ?? "Erro ao buscar portfólio." });
    } finally {
      set({ loading: false });
    }
  },

  addAsset: async (payload) => {
    set({ loading: true, error: null });
    try {
      await api.post("/api/v1/portfolio/assets", payload);
      await get().fetchAssets();
    } catch (err: any) {
      set({ error: err.response?.data?.detail ?? "Erro ao adicionar ativo." });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteAsset: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/v1/portfolio/assets/${id}`);
      await get().fetchAssets();
    } catch (err: any) {
      set({ error: err.response?.data?.detail ?? "Erro ao remover ativo." });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
