export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: number;
  name: string;
  email: string;
  mobile?: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  expense_count?: number;
  total_paid?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  expense_count?: number;
  total_spent?: number;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  paid_by_user_id: number;
  paid_by_name?: string;
  paid_by_email?: string;
  location?: string | null;
  description?: string | null;
  expense_date: string; // YYYY-MM-DD
  expense_time: string; // HH:mm or hh:mm a
  created_by_user_id: number;
  created_by_name?: string;
  created_by_email?: string;
  created_at: string;
  created_at_ist?: string;
  updated_at: string;
  updated_at_ist?: string;
}

export interface DashboardSummary {
  totalMembers: number;
  activeMembers: number;
  totalExpensesCount: number;
  totalAmountPaid: number;
  todayExpenses: number;
  todayExpensesCount: number;
  currentMonthExpenses: number;
  currentMonthExpensesCount: number;
}

export interface MemberReportItem {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  expenseCount: number;
  totalPaid: number;
  thisMonthPaid: number;
  todayPaid: number;
  percentage: number;
}

export interface CategoryReportItem {
  id: number;
  name: string;
  icon?: string | null;
  count: number;
  total: number;
  percentage: number;
}

export interface MonthlyDataPoint {
  month: string;
  monthKey: string;
  name: string;
  total: number;
  count: number;
}

export interface DailyDataPoint {
  date: string;
  displayDate: string;
  total: number;
  count: number;
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
  created_at_ist?: string;
}

export interface AppSettings {
  websiteName: string;
  tagline: string;
  currencySymbol: string;
  allowMemberRegistration: string;
}
