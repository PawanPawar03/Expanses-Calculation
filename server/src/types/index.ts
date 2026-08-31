export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  mobile?: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string; // ISO UTC string
  updated_at: string;
  deleted_at?: string | null;
}

export interface UserPublic {
  id: number;
  name: string;
  email: string;
  mobile?: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category_id: number;
  paid_by_user_id: number;
  location?: string | null;
  description?: string | null;
  expense_date: string; // YYYY-MM-DD in IST
  expense_time: string; // HH:mm or HH:mm:ss in IST
  created_by_user_id: number;
  created_at: string; // ISO UTC string
  updated_at: string;
  deleted_at?: string | null;
}

export interface ExpenseWithRelations extends Expense {
  category_name?: string;
  category_icon?: string;
  paid_by_name?: string;
  paid_by_email?: string;
  created_by_name?: string;
  created_by_email?: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_value?: string | null;
  new_value?: string | null;
  details?: string | null;
  created_at: string;
}

export interface AppSetting {
  id: number;
  key: string;
  value: string;
  updated_by?: number | null;
  updated_at: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}
