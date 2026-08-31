import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Expense } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ExpenseFilterBar, FilterState } from '../../components/expenses/ExpenseFilterBar';
import { ExpenseCard } from '../../components/expenses/ExpenseCard';
import { ExpenseDetailsModal } from '../../components/expenses/ExpenseDetailsModal';
import { formatCurrency, formatISTDate } from '../../lib/time';
import { exportToCSV } from '../../lib/utils';
import { Wallet, PlusCircle, Calendar, Clock, Receipt, Eye } from 'lucide-react';

const initialFilters: FilterState = {
  preset: '',
  startDate: '',
  endDate: '',
  memberId: '',
  categoryId: 'all',
  sortBy: 'date_desc',
  search: '',
};

export const MyExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const { settings, openAddExpenseModal, refreshTrigger, showToast } = useApp();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [stats, setStats] = useState({
    totalExpensesPaid: 0,
    numberOfExpenses: 0,
    thisMonthPaid: 0,
    todayPaid: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  useEffect(() => {
    async function loadMyExpenses() {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const [userRes, expRes] = await Promise.all([
          api.get(`/users/${user.id}`),
          api.get(`/expenses?myExpensesOnly=true&categoryId=${filters.categoryId}&preset=${filters.preset}&sortBy=${filters.sortBy}&search=${filters.search}`),
        ]);

        if (userRes.success && userRes.stats) {
          setStats(userRes.stats);
        }
        if (expRes.success) {
          setExpenses(expRes.expenses);
        }
      } catch (err) {
        console.error('Fetch my expenses error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMyExpenses();
  }, [user?.id, filters, refreshTrigger]);

  const handleExport = () => {
    if (!expenses.length) return;
    const exportData = expenses.map((e) => ({
      'ID': e.id,
      'Expense Title': e.title,
      'Category': e.category_name,
      'Amount (INR)': e.amount,
      'Where / Shop': e.location || '',
      'Expense Date': e.expense_date,
      'Expense Time': e.expense_time,
    }));
    exportToCSV(`my_expenses_${Date.now()}.csv`, exportData);
    showToast('Exported your expenses to CSV!', 'success');
  };

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Expenses & Contributions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Overview of all shared expenses paid by {user?.name}
          </p>
        </div>

        <Button
          variant="brand"
          size="md"
          onClick={openAddExpenseModal}
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="shadow-sm font-bold self-start sm:self-auto"
        >
          Add Expense
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Paid by Me"
          value={formatCurrency(stats.totalExpensesPaid, currency)}
          subtitle={`${stats.numberOfExpenses} items paid`}
          icon={<Wallet className="w-6 h-6 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />

        <StatCard
          title="This Month (IST)"
          value={formatCurrency(stats.thisMonthPaid, currency)}
          subtitle="Your spend this month"
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          iconBgColor="bg-purple-50"
        />

        <StatCard
          title="Today (IST)"
          value={formatCurrency(stats.todayPaid, currency)}
          subtitle="Your spend today"
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          iconBgColor="bg-amber-50"
        />

        <StatCard
          title="Logged Items"
          value={stats.numberOfExpenses}
          subtitle="Transactions recorded"
          icon={<Receipt className="w-6 h-6 text-blue-600" />}
          iconBgColor="bg-blue-50"
        />
      </div>

      {/* Filters */}
      <ExpenseFilterBar
        filters={filters}
        onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
        onReset={() => setFilters(initialFilters)}
        onExport={handleExport}
        hideMemberFilter={true}
      />

      {/* Expenses List */}
      <Card className="p-0 overflow-hidden">
        {/* Mobile View */}
        <div className="block md:hidden p-4 space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No expenses recorded by you yet.</p>
              <Button variant="brand" size="sm" onClick={openAddExpenseModal} leftIcon={<PlusCircle className="w-4 h-4" />}>
                Record Expense
              </Button>
            </div>
          ) : (
            expenses.map((exp) => (
              <ExpenseCard key={exp.id} expense={exp} onClick={(e) => setSelectedExpense(e)} />
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Expense</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Where / Place</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Time (IST)</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No expenses recorded by you.</p>
                    <p className="text-xs text-slate-400">Add an expense to start tracking your contribution.</p>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    onClick={() => setSelectedExpense(exp)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {exp.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="emerald" size="sm">
                        {exp.category_name}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatCurrency(exp.amount, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {exp.location || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 font-mono">
                      {formatISTDate(exp.expense_date)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                      {exp.expense_time}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-xs font-bold text-emerald-600 hover:text-emerald-700 group-hover:underline">
                        Details
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Modal */}
      <ExpenseDetailsModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
      />
    </div>
  );
};
