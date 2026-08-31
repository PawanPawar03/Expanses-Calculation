import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { User, Expense } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ExpenseCard } from '../../components/expenses/ExpenseCard';
import { ExpenseDetailsModal } from '../../components/expenses/ExpenseDetailsModal';
import { formatCurrency, formatISTDate } from '../../lib/time';
import {
  Wallet,
  Receipt,
  Calendar,
  Clock,
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { settings } = useApp();
  const navigate = useNavigate();

  const [member, setMember] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalExpensesPaid: 0,
    numberOfExpenses: 0,
    thisMonthPaid: 0,
    todayPaid: 0,
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMemberDetail() {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/users/${id}`);
        if (res.success) {
          setMember(res.user);
          setStats(res.stats);
          setExpenses(res.expenses || []);
        }
      } catch (err) {
        console.error('Fetch member detail error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMemberDetail();
  }, [id]);

  const currency = settings.currencySymbol || '₹';

  if (!member && !isLoading) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Member Not Found</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/members')}>
          Return to Members List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Members
      </button>

      {/* Member Profile Header Card */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white font-black text-2xl shadow-md uppercase">
              {member?.name.charAt(0) || 'M'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{member?.name}</h1>
                <Badge variant={member?.role === 'ADMIN' ? 'brand' : 'slate'} size="sm">
                  {member?.role}
                </Badge>
                <Badge variant={member?.status === 'ACTIVE' ? 'emerald' : 'rose'} size="sm">
                  {member?.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {member?.email}
                </span>
                {member?.mobile && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {member.mobile}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined: {formatISTDate(member?.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expenses Paid"
          value={formatCurrency(stats.totalExpensesPaid, currency)}
          subtitle="Lifetime sum of paid items"
          icon={<Wallet className="w-6 h-6 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />

        <StatCard
          title="Number of Expenses"
          value={stats.numberOfExpenses}
          subtitle="Transactions logged"
          icon={<Receipt className="w-6 h-6 text-blue-600" />}
          iconBgColor="bg-blue-50"
        />

        <StatCard
          title="This Month (IST)"
          value={formatCurrency(stats.thisMonthPaid, currency)}
          subtitle="Month to date total"
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          iconBgColor="bg-purple-50"
        />

        <StatCard
          title="Today (IST)"
          value={formatCurrency(stats.todayPaid, currency)}
          subtitle="Paid by member today"
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          iconBgColor="bg-amber-50"
        />
      </div>

      {/* Member Expenses List */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {member?.name}'s Expenses
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological list of all expenses paid by {member?.name}
          </p>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden p-4 space-y-3">
          {expenses.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">
              No expenses recorded for this member.
            </p>
          ) : (
            expenses.map((exp) => (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                onClick={(e) => setSelectedExpense(e)}
              />
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Expense Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Where / Place</th>
                <th className="py-3.5 px-4">Expense Date</th>
                <th className="py-3.5 px-4">Time (IST)</th>
                <th className="py-3.5 px-4">Added By</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No expenses recorded for this member.
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
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {exp.created_by_name}
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

        {/* Total Summary Banner at bottom */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Paid Summary
            </p>
            <p className="text-base font-bold text-white">
              Total Paid by {member?.name}:
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              {formatCurrency(stats.totalExpensesPaid, currency)}
            </span>
          </div>
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
