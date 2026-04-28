import { createClient } from "@/lib/supabase/client";
import type { Debt, DebtDirection } from "@/types/models";

export const debtsService = {
  async getAll(userId: string): Promise<Debt[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("debts").select("*").eq("user_id", userId).order("date", { ascending: false });
    if (error) throw error;
    return data as Debt[];
  },

  async create(debt: {
    user_id: string; person_name: string; amount: number;
    currency_code: string; direction: DebtDirection; description?: string; date: string;
  }): Promise<Debt> {
    const supabase = createClient();
    const { data, error } = await supabase.from("debts").insert(debt).select().single();
    if (error) throw error;
    return data as Debt;
  },

  async markPaid(id: string, paid: boolean): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("debts").update({ paid }).eq("id", id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("debts").delete().eq("id", id);
    if (error) throw error;
  },
};
