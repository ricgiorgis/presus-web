import { createClient } from "@/lib/supabase/client";
import type { Expense } from "@/types/models";

export const expensesService = {
  async getAll(
    userId: string,
    filters?: { category?: string; month?: string; sharedFilter?: "all" | "shared" | "personal" },
    familyGroupId?: string | null
  ) {
    const supabase = createClient();
    let query = supabase.from("gastos").select("*").order("date", { ascending: false });

    if (familyGroupId) {
      query = query.eq("family_group_id", familyGroupId);
      if (filters?.sharedFilter === "shared") query = query.eq("is_shared", true);
      else if (filters?.sharedFilter === "personal") {
        query = query.eq("is_shared", false).eq("added_by_user_id", userId);
      }
    } else {
      query = query.eq("user_id", userId);
    }

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
