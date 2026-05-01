import { createClient } from "@/lib/supabase/client";
import type { Budget } from "@/types/models";

export const budgetService = {
  async getAll(userId: string, familyGroupId?: string | null) {
    const supabase = createClient();
    let query = supabase.from("presupuesto").select("*").order("category");
    query = familyGroupId
      ? query.eq("family_group_id", familyGroupId)
      : query.eq("user_id", userId);
    const { data, error } = await query;
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
