import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { DashboardSummary, MemberReportItem, CategoryReportItem, AuditLog } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MemberSpendingChart } from '../../components/charts/MemberSpendingChart';
import { CategoryPieChart } from '../../components/charts/CategoryPieChart';
import { formatCurrency } from '../../lib/time';
import {
  Users,
  UserCheck,
  Receipt,
  Clock,
  Calendar,
  Wallet,
  ShieldCheck,
  PlusCircle,
  UserPlus,
  History,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { settings, openAddExpenseModal, refreshTrigger } = useApp();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [members, setMembers] = useState<MemberReportItem[]>([]);
  const [categories, setCategories] = useState<CategoryReportItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      setIsLoading(true);
      try {
        const [sumRes, memRes, catRes, logRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/members'),
          api.get('/reports/categories'),
          api.get('/audit-logs?limit=5'),
        ]);

        if (sumRes.success) setSummary(sumRes.summary);
        if (memRes.success) setMembers(memRes.members);
        if (catRes.success) setCategories(catRes.categories);
        if (logRes.success) setRecentLogs(logRes.logs);
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAdminData();
  }, [refreshTrigger]);

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-850 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrator Control Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Whitehouse Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
              Manage all household members, audit expenses, configure categories, and monitor financials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="brand"
              size="md"
              onClick={openAddExpenseModal}
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="font-bold shadow-sm"
            >
              Add Expense
            </Button>
            <Link to="/admin/members/add">
              <Button
                variant="outline"
                size="md"
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 font-bold"
              >
                Add Member
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 6 Master Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Members"
          value={summary?.totalMembers || 0}
          subtitle="Household accounts"
          icon={<Users className="w-5 h-5 text-slate-700" />}
          iconBgColor="bg-slate-100"
        />

        <StatCard
          title="Active Members"
          value={summary?.activeMembers || 0}
          subtitle="Currently active"
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />

        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.totalAmountPaid || 0, currency)}
          subtitle={`${summary?.totalExpensesCount || 0} logged items`}
          icon={<Receipt className="w-5 h-5 text-blue-600" />}
          iconBgColor="bg-blue-50"
        />

        <StatCard
          title="Today's Spend (IST)"
          value={formatCurrency(summary?.todayExpenses || 0, currency)}
          subtitle={`${summary?.todayExpensesCount || 0} items today`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          iconBgColor="bg-amber-50"
        />

        <StatCard
          title="This Month (IST)"
          value={formatCurrency(summary?.currentMonthExpenses || 0, currency)}
          subtitle={`${summary?.currentMonthExpensesCount || 0} items this month`}
          icon={<Calendar className="w-5 h-5 text-purple-600" />}
          iconBgColor="bg-purple-50"
        />

        <StatCard
          title="Total Paid Out"
          value={formatCurrency(summary?.totalAmountPaid || 0, currency)}
          subtitle="Grand settlement total"
          icon={<Wallet className="w-5 h-5 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />
      </div>

      {/* Analytics Preview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader>
            <div>
              <CardTitle>Member Spending Breakdown</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Real-time dynamic sums from database</p>
            </div>
            <Link to="/admin/analytics">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Full Analytics
              </Button>
            </Link>
          </CardHeader>
          <MemberSpendingChart data={members} />
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <div>
              <CardTitle>Category Breakdown</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Spend distribution across categories</p>
            </div>
          </CardHeader>
          <CategoryPieChart data={categories} />
        </Card>
      </div>

      {/* Recent Audit Logs Strip */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <div>
              <CardTitle>Recent Audit Trail</CardTitle>
              <p className="text-xs text-slate-500">Live timestamped log of member and expense actions</p>
            </div>
          </div>
          <Link to="/admin/audit-logs">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Logs
            </Button>
          </Link>
        </CardHeader>

        <div className="divide-y divide-slate-100">
          {recentLogs.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">No recent audit events.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="slate" size="sm">{log.action}</Badge>
                    <span className="font-bold text-slate-900">{log.user_name || 'System'}</span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
                <div className="shrink-0 text-slate-400 font-mono text-[11px]">
                  {log.created_at_ist}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
