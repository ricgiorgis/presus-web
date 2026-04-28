import { createClient } from "@/lib/supabase/client";
import type { FamilyGroup, FamilyExpense } from "@/types/models";

export const familyService = {
  async getGroups(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("familia_groups").select("*").eq("user_id", userId);
    if (error) throw error;
    return data as FamilyGroup[];
  },

  async createGroup(group: Omit<FamilyGroup, "id" | "created_at">) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("familia_groups")
      .insert({ ...group, members: JSON.stringify(group.members) })
      .select().single();
    if (error) throw error;
    return data as FamilyGroup;
  },

  async updateGroup(id: string, updates: Partial<Omit<FamilyGroup, "id" | "user_id" | "created_at">>) {
    const supabase = createClient();
    const payload = updates.members ? { ...updates, members: JSON.stringify(updates.members) } : updates;
    const { data, error } = await supabase
      .from("familia_groups").update(payload).eq("id", id).select().single();
    if (error) throw error;
    return data as FamilyGroup;
  },

  async deleteGroup(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("familia_groups").delete().eq("id", id);
    if (error) throw error;
  },

  async getExpenses(familyGroupId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("familia_expenses").select("*").eq("family_group_id", familyGroupId).order("date", { ascending: false });
    if (error) throw error;
    return data as FamilyExpense[];
  },

  async createExpense(expense: Omit<FamilyExpense, "id" | "created_at">) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("familia_expenses")
      .insert({ ...expense, splits: JSON.stringify(expense.splits) })
      .select().single();
    if (error) throw error;
    return data as FamilyExpense;
  },

  async deleteExpense(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("familia_expenses").delete().eq("id", id);
    if (error) throw error;
  },
};
