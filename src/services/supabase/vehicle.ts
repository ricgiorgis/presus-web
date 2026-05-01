import { createClient } from "@/lib/supabase/client";
import type { Vehicle, FuelLog, MaintenanceLog } from "@/types/models";

export const vehicleService = {
  async getAll(userId: string, familyGroupId?: string | null) {
    const supabase = createClient();
    let query = supabase.from("vehiculos").select("*").order("created_at", { ascending: true });
    query = familyGroupId
      ? query.eq("family_group_id", familyGroupId)
      : query.eq("user_id", userId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Vehicle[];
  },

  async create(vehicle: Omit<Vehicle, "id" | "created_at">) {
    const supabase = createClient();
    const { data, error } = await supabase.from("vehiculos").insert(vehicle).select().single();
    if (error) throw error;
    return data as Vehicle;
  },

  async update(id: string, updates: Partial<Omit<Vehicle, "id" | "user_id" | "created_at">>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vehiculos").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data as Vehicle;
  },

  async delete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("vehiculos").delete().eq("id", id);
    if (error) throw error;
  },

  async getFuelLogs(vehicleId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("fuel_logs").select("*").eq("vehicle_id", vehicleId).order("date", { ascending: false });
    if (error) throw error;
    return data as FuelLog[];
  },

  async addFuelLog(log: Omit<FuelLog, "id" | "created_at" | "total_cost">) {
    const supabase = createClient();
    const { data, error } = await supabase.from("fuel_logs").insert(log).select().single();
    if (error) throw error;
    return data as FuelLog;
  },

  async deleteFuelLog(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("fuel_logs").delete().eq("id", id);
    if (error) throw error;
  },

  async getMaintenanceLogs(vehicleId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("maintenance_logs").select("*").eq("vehicle_id", vehicleId).order("date", { ascending: false });
    if (error) throw error;
    return data as MaintenanceLog[];
  },

  async addMaintenanceLog(log: Omit<MaintenanceLog, "id" | "created_at">) {
    const supabase = createClient();
    const { data, error } = await supabase.from("maintenance_logs").insert(log).select().single();
    if (error) throw error;
    return data as MaintenanceLog;
  },

  async deleteMaintenanceLog(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("maintenance_logs").delete().eq("id", id);
    if (error) throw error;
  },
};
