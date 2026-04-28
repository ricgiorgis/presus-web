import { createClient } from "@/lib/supabase/client";
import type { Budget } from "@/types/models";

export const budgetService = {
  async getAll(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("presupuesto").select("*").eq("user_id", userId).order("category");
    if (error) throw error;
    return data as Budget[];
  },

  async create(budget: Omit<Budget, "id" | "created_at">) {
    const supabase = createClient();
    const { data, error } = await supabase.from("presupuesto").insert(budget).select().single();
    if (error) throw error;
    return data as Budget;
  },

  async update(id: string, updates: Partial<Omit<Budget, "id" | "user_id" | "created_at">>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("presupuesto").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data as Budget;
  },

  async delete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("presupuesto").delete().eq("id", id);
    if (error) throw error;
  },
};
