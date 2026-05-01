import { createClient } from "@/lib/supabase/client";
import type { Goal } from "@/types/models";

export const goalsService = {
  async getAll(userId: string, familyGroupId?: string | null) {
    const supabase = createClient();
    let query = supabase.from("metas").select("*").order("created_at", { ascending: false });
    query = familyGroupId
      ? query.eq("family_group_id", familyGroupId)
      : query.eq("user_id", userId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Goal[];
  },

  async create(goal: Omit<Goal, "id" | "created_at">) {
    const supabase = createClient();
    const { data, error } = await supabase.from("metas").insert(goal).select().single();
    if (error) throw error;
    return data as Goal;
  },

  async update(id: string, updates: Partial<Omit<Goal, "id" | "user_id" | "created_at">>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("metas").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data as Goal;
  },

  async addFunds(id: string, amount: number) {
    const supabase = createClient();
    const { data: current, error: fetchError } = await supabase
      .from("metas").select("current_amount").eq("id", id).single();
    if (fetchError) throw fetchError;
    return goalsService.update(id, { current_amount: (current.current_amount as number) + amount });
  },

  async delete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("metas").delete().eq("id", id);
    if (error) throw error;
  },
};
