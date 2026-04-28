export type CurrencyCode = string;

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  currency_code: CurrencyCode;
  category: string;
  description: string;
  date: string;
  installment_id?: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  currency_code: CurrencyCode;
  period: "monthly" | "weekly";
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
  created_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
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

export interface FamilyGroup {
  id: string;
  user_id: string;
  name: string;
  members: FamilyMember[];
  created_at: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  avatar_color: string;
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

export interface CustomCategory {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  created_at: string;
}

export type DebtDirection = "i_owe" | "they_owe";

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
  created_at: string;
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

export interface ExchangeRate {
  id: string;
  user_id: string;
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
  rate: number;
  date: string;
  created_at: string;
}
