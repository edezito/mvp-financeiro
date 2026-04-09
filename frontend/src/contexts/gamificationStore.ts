"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface GamificationStoreState {
  // Streak data
  streak: {
    current_streak: number;
    longest_streak: number;
    total_points: number;
    badge: any;
  } | null;

  // Investment goals
  goals: any[];

  // Loading states
  loading: {
    streak: boolean;
    goals: boolean;
  };

  // Errors
  error: string | null;

  // Actions
  fetchStreak: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  recordActivity: (action: string) => Promise<void>;
  clearError: () => void;
}

export const useGamificationStore = create<GamificationStoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      streak: null,
      goals: [],
      loading: {
        streak: false,
        goals: false,
      },
      error: null,

      // Actions
      fetchStreak: async () => {
        set((state) => ({
          loading: { ...state.loading, streak: true },
          error: null
        }));

        try {
          const response = await fetch("/api/v1/b3/streak", {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("firebase_token")}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch streak");
          }

          const data = await response.json();
          set({ streak: data, loading: { ...get().loading, streak: false } });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            loading: { ...get().loading, streak: false }
          });
        }
      },

      fetchGoals: async () => {
        set((state) => ({
          loading: { ...state.loading, goals: true },
          error: null
        }));

        try {
          const response = await fetch("/api/v1/b3/goals", {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("firebase_token")}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch goals");
          }

          const data = await response.json();
          set({ goals: data, loading: { ...get().loading, goals: false } });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            loading: { ...get().loading, goals: false }
          });
        }
      },

      recordActivity: async (action: string) => {
        try {
          await fetch("/api/v1/b3/activities", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("firebase_token")}`,
            },
            body: JSON.stringify({ action }),
          });
        } catch (error) {
          console.error("Failed to record activity:", error);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "gamification-store",
    }
  )
);