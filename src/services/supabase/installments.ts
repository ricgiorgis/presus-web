import { createClient } from "@/lib/supabase/client";
import type { Installment } from "@/types/models";

export const installmentsService = {
  async getAll(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cuotas").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return data as Installment[];
  },

  async create(installment: Omit<Installment, "id" | "created_at">) {
    const supabase = createClient();
    const { data, error } = await supabase.from("cuotas").insert(installment).select().single();
    if (error) throw error;
    return data as Installment;
  },

  async markPaid(id: string) {
    const supabase = createClient();
    const { data: current, error: fetchError } = await supabase
      .from("cuotas").select("paid_count").eq("id", id).single();
    if (fetchError) throw fetchError;
    const { data, error } = await supabase
      .from("cuotas").update({ paid_count: (current.paid_count as number) + 1 }).eq("id", id).select().single();
    if (error) throw error;
    return data as Installment;
  },

  async delete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("cuotas").delete().eq("id", id);
    if (error) throw error;
  },
};
