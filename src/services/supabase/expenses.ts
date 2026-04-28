import { createClient } from "@/lib/supabase/client";
import type { Expense } from "@/types/models";

export const expensesService = {
  async getAll(userId: string, filters?: { category?: string; month?: string }) {
    const supabase = createClient();
    let query = supabase
      .from("gastos")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.month) {
      query = query.gte("date", `${filters.month}-01`).lte("date", `${filters.month}-31`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Expense[];
  },

  async create(expense: Omit<Expense, "id" | "created_at">) {
    const supabase = createClient();
    const { data, error } = await supabase.from("gastos").insert(expense).select().single();
    if (error) throw error;
    return data as Expense;
  },

  async update(id: string, updates: Partial<Omit<Expense, "id" | "user_id" | "created_at">>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("gastos").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data as Expense;
  },

  async delete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("gastos").delete().eq("id", id);
    if (error) throw error;
  },
};
