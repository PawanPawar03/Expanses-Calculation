import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { DashboardSummary, Expense, MemberReportItem, CategoryReportItem } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ExpenseDetailsModal } from '../../components/expenses/ExpenseDetailsModal';
import { MemberSpendingChart } from '../../components/charts/MemberSpendingChart';
import { CategoryPieChart } from '../../components/charts/CategoryPieChart';
import { formatCurrency, formatISTDate } from '../../lib/time';
import {
  Wallet,
  Receipt,
  Calendar,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Users,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { settings, openAddExpenseModal, refreshTrigger } = useApp();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [memberReports, setMemberReports] = useState<MemberReportItem[]>([]);
  const [categoryReports, setCategoryReports] = useState<CategoryReportItem[]>([]);
  const [myTotalPaid, setMyTotalPaid] = useState<number>(0);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [sumRes, expRes, memRes, catRes, userDetailRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/expenses?limit=6&sortBy=date_desc'),
          api.get('/reports/members'),
          api.get('/reports/categories'),
          user?.id ? api.get(`/users/${user.id}`) : Promise.resolve(null),
        ]);

        if (sumRes.success) setSummary(sumRes.summary);
        if (expRes.success) setRecentExpenses(expRes.expenses);
        if (memRes.success) setMemberReports(memRes.members);
        if (catRes.success) setCategoryReports(catRes.categories);
        if (userDetailRes?.success && userDetailRes.stats) {
          setMyTotalPaid(userDetailRes.stats.totalExpensesPaid);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [refreshTrigger, user?.id]);

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Household Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Namaste, {user?.name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              Track, split, and stay transparent with shared household expenses in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="brand"
              size="lg"
              onClick={openAddExpenseModal}
              leftIcon={<PlusCircle className="w-5 h-5" />}
              className="shadow-lg font-bold"
            >
              Add Expense
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total House Expenses"
          value={formatCurrency(summary?.totalAmountPaid || 0, currency)}
          subtitle={`${summary?.totalExpensesCount || 0} total logged items`}
          icon={<Receipt className="w-6 h-6 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />

        <StatCard
          title="My Total Contribution"
          value={formatCurrency(myTotalPaid, currency)}
          subtitle="Total paid by you"
          icon={<Wallet className="w-6 h-6 text-blue-600" />}
          iconBgColor="bg-blue-50"
        />

        <StatCard
          title="This Month (IST)"
          value={formatCurrency(summary?.currentMonthExpenses || 0, currency)}
          subtitle={`${summary?.currentMonthExpensesCount || 0} expenses this month`}
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          iconBgColor="bg-purple-50"
        />

        <StatCard
          title="Today's Spend (IST)"
          value={formatCurrency(summary?.todayExpenses || 0, currency)}
          subtitle={`${summary?.todayExpensesCount || 0} expenses today`}
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          iconBgColor="bg-amber-50"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Member Spending Bar Chart */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div>
              <CardTitle>Member-wise Spending</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Total ₹ paid per member</p>
            </div>
            <Link to="/reports">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Details
              </Button>
            </Link>
          </CardHeader>
          <MemberSpendingChart data={memberReports} />
        </Card>

        {/* Category Breakdown Donut */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div>
              <CardTitle>Category Breakdown</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Spend distribution across categories</p>
            </div>
          </CardHeader>
          <CategoryPieChart data={categoryReports} />
        </Card>
      </div>

      {/* Recent Expenses List */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Expenses</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Latest household items added</p>
          </div>
          <Link to="/expenses">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Expenses
            </Button>
          </Link>
        </CardHeader>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No expenses recorded yet.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start tracking your Whitehouse shared expenses by recording the first transaction.
            </p>
            <Button variant="brand" size="sm" onClick={openAddExpenseModal} leftIcon={<PlusCircle className="w-4 h-4" />}>
              Add First Expense
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-3 px-3">Expense</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Paid By</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3">Where</th>
                  <th className="pb-3 px-3">Date (IST)</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    onClick={() => setSelectedExpense(exp)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3 font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {exp.title}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="emerald" size="sm">
                        {exp.category_name}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {exp.paid_by_name}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {formatCurrency(exp.amount, currency)}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {exp.location || '-'}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 font-mono">
                      {formatISTDate(exp.expense_date)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 group-hover:underline">
                        Details
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Expense Details Modal */}
      <ExpenseDetailsModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
      />
    </div>
  );
};
