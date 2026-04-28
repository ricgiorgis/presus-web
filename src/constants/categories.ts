import type { CustomCategory } from "@/types/models";

export interface ExpenseCategory {
  id: string;
  labelKey: string;
  emoji: string;
  color: string;
  label?: string;
  isCustom?: boolean;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "alimentacion", labelKey: "categories.alimentacion", emoji: "🍔", color: "#FF6B6B" },
  { id: "transporte", labelKey: "categories.transporte", emoji: "🚗", color: "#4ECDC4" },
  { id: "salud", labelKey: "categories.salud", emoji: "🏥", color: "#45B7D1" },
  { id: "educacion", labelKey: "categories.educacion", emoji: "📚", color: "#96CEB4" },
  { id: "entretenimiento", labelKey: "categories.entretenimiento", emoji: "🎮", color: "#FFEAA7" },
  { id: "hogar", labelKey: "categories.hogar", emoji: "🏠", color: "#DDA0DD" },
  { id: "ropa", labelKey: "categories.ropa", emoji: "👕", color: "#98D8C8" },
  { id: "servicios", labelKey: "categories.servicios", emoji: "⚡", color: "#F7DC6F" },
  { id: "tecnologia", labelKey: "categories.tecnologia", emoji: "💻", color: "#85C1E9" },
  { id: "viajes", labelKey: "categories.viajes", emoji: "✈️", color: "#F0B27A" },
  { id: "mascotas", labelKey: "categories.mascotas", emoji: "🐾", color: "#A9CCE3" },
  { id: "otros", labelKey: "categories.otros", emoji: "📦", color: "#BDC3C7" },
];

export const getCategoryById = (id: string): ExpenseCategory | undefined =>
  EXPENSE_CATEGORIES.find((c) => c.id === id);

export function customToExpenseCategory(c: CustomCategory): ExpenseCategory {
  return {
    id: c.id,
    labelKey: "",
    emoji: c.emoji,
    color: c.color,
    label: c.name,
    isCustom: true,
  };
}
