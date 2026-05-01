export type CurrencyCode = string;

export type FamilyGroupType = "pareja" | "familiar" | "roommates";

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  currency_code: CurrencyCode;
  category: string;
  description: string;
  date: string;
  installment_id?: string | null;
  family_group_id?: string | null;
  is_shared: boolean;
  added_by_user_id?: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  currency_code: CurrencyCode;
  period: "monthly" | "weekly";
  family_group_id?: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency_code: CurrencyCode;
  deadline?: string | null;
  color: string;
  family_group_id?: string | null;
  added_by_user_id?: string | null;
  created_at: string;
}

export interface Installment {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  installments_count: number;
  paid_count: number;
  start_date: string;
  currency_code: CurrencyCode;
  family_group_id?: string | null;
  added_by_user_id?: string | null;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  person_name: string;
  amount: number;
  currency_code: CurrencyCode;
  direction: DebtDirection;
  description?: string | null;
  date: string;
  paid: boolean;
  family_group_id?: string | null;
  added_by_user_id?: string | null;
  created_at: string;
}

export type DebtDirection = "i_owe" | "they_owe";

export interface CustomCategory {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  family_group_id?: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  family_group_id?: string | null;
  created_at: string;
}

export interface FuelLog {
  id: string;
  vehicle_id: string;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  currency_code: CurrencyCode;
  date: string;
  odometer?: number | null;
  created_at: string;
}

export type MaintenanceServiceType = "aceite" | "llantas" | "revision_general" | "otro";

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  service_type: MaintenanceServiceType;
  odometer: number;
  cost: number;
  currency_code: CurrencyCode;
  date: string;
  next_service_km?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface FamilyGroup {
  id: string;
  user_id: string;
  name: string;
  type: FamilyGroupType;
  invite_code: string;
  max_members: number;
  members: FamilyMember[]; // legacy JSON field, kept for compat
  created_at: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  avatar_color: string;
}

export interface FamiliaDbMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
}

export interface FamilyInvite {
  id: string;
  group_id: string;
  invite_email?: string | null;
  invite_code: string;
  invited_by: string;
  status: "pending" | "accepted" | "declined" | "expired";
  created_at: string;
  expires_at: string;
}

export interface FamilyGroupWithMembers extends FamilyGroup {
  familia_members: FamiliaDbMember[];
}

export interface FamilyExpense {
  id: string;
  family_group_id: string;
  description: string;
  total_amount: number;
  currency_code: CurrencyCode;
  date: string;
  splits: ExpenseSplit[];
  created_at: string;
}

export interface ExpenseSplit {
  member_id: string;
  amount: number;
  paid: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  preferred_currency: CurrencyCode;
  preferred_language: string;
  created_at: string;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string | null;
  updated_at: string;
}

export interface ExchangeRate {
  id: string;
  user_id: string;
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
  rate: number;
  date: string;
  created_at: string;
}
