import { createClient } from "@/lib/supabase/client";
import type { CustomCategory } from "@/types/models";

export const customCategoriesService = {
  async getAll(userId: string, familyGroupId?: string | null): Promise<CustomCategory[]> {
    const supabase = createClient();
    let query = supabase.from("custom_categories").select("*").order("created_at", { ascending: true });
    query = familyGroupId
      ? query.eq("family_group_id", familyGroupId)
      : query.eq("user_id", userId);
    const { data, error } = await query;
    if (error) throw error;
    return data as CustomCategory[];
  },

  async create(cat: {
    user_id: string; name: string; emoji: string; color: string;
    family_group_id?: string | null;
  }): Promise<CustomCategory> {
    const supabase = createClient();
    const { data, error } = await supabase.from("custom_categories").insert(cat).select().single();
    if (error) throw error;
    return data as CustomCategory;
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("custom_categories").delete().eq("id", id);
    if (error) throw error;
  },
};
