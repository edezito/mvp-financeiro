import { create } from "zustand";
import api from "@/lib/api";
import type { StreakData, InvestmentGoal, GoalCreatePayload } from "@/lib/types";

interface GamificationState {
  streak: StreakData | null;
  goals: InvestmentGoal[];
  loading: boolean;
  error: string | null;

  fetchStreak: () => Promise<void>;
  recordActivity: (action: string) => Promise<void>;
  fetchGoals: () => Promise<void>;
  createGoal: (payload: GoalCreatePayload) => Promise<void>;
  updateGoalValue: (goalId: string, currentValue: number) => Promise<void>;
  clearError: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  streak: null,
  goals: [],
  loading: false,
  error: null,

  fetchStreak: async () => {
    try {
      const { data } = await api.get<StreakData>("/api/v1/gamification/streak");
      set({ streak: data });
    } catch {
      // silencioso
    }
  },

  recordActivity: async (action: string) => {
    try {
      const { data } = await api.post<StreakData>("/api/v1/gamification/streak/activity", {
        action,
      });
      set({ streak: data });
    } catch {
      // silencioso
    }
  },

  fetchGoals: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get<InvestmentGoal[]>("/api/v1/gamification/goals");
      set({ goals: data });
    } catch (err: any) {
      set({ error: err.response?.data?.detail ?? "Erro ao buscar metas." });
    } finally {
      set({ loading: false });
    }
  },

  createGoal: async (payload) => {
    set({ loading: true, error: null });
    try {
      await api.post("/api/v1/gamification/goals", payload);
      await get().fetchGoals();
    } catch (err: any) {
      set({ error: err.response?.data?.detail ?? "Erro ao criar meta." });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateGoalValue: async (goalId, currentValue) => {
    try {
      await api.patch(`/api/v1/gamification/goals/${goalId}`, { current_value: currentValue });
      await get().fetchGoals();
    } catch {
      // silencioso
    }
  },

  clearError: () => set({ error: null }),
}));
