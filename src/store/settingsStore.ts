"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  language: string;
  currency: string;
  theme: "light" | "dark" | "system";
  budgetPeriod: "monthly" | "weekly";
  pinEnabled: boolean;
  pinHash: string | null;
  setLanguage: (lang: string) => void;
  setCurrency: (currency: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setBudgetPeriod: (period: "monthly" | "weekly") => void;
  setPinEnabled: (enabled: boolean) => void;
  setPinHash: (hash: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: "es",
      currency: "ARS",
      theme: "system",
      budgetPeriod: "monthly",
      pinEnabled: false,
      pinHash: null,
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
      setBudgetPeriod: (budgetPeriod) => set({ budgetPeriod }),
      setPinEnabled: (pinEnabled) => set({ pinEnabled }),
      setPinHash: (pinHash) => set({ pinHash }),
    }),
    { name: "presus-settings" }
  )
);
