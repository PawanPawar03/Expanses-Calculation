import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Expense } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ExpenseFilterBar, FilterState } from '../../components/expenses/ExpenseFilterBar';
import { ExpenseCard } from '../../components/expenses/ExpenseCard';
import { ExpenseDetailsModal } from '../../components/expenses/ExpenseDetailsModal';
import { ExpenseFormModal } from '../../components/expenses/ExpenseFormModal';
import { formatCurrency, formatISTDate } from '../../lib/time';
import { exportToCSV } from '../../lib/utils';
import {
  Receipt,
  PlusCircle,
  Eye,
  Calendar,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

const initialFilters: FilterState = {
  preset: '',
  startDate: '',
  endDate: '',
  memberId: 'all',
  categoryId: 'all',
  sortBy: 'date_desc',
  search: '',
};

export const ExpensesPage: React.FC = () => {
  const { settings, openAddExpenseModal, refreshTrigger, triggerRefresh, showToast } = useApp();
  const { isAdmin, user } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.preset) params.append('preset', filters.preset);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.memberId && filters.memberId !== 'all') params.append('memberId', filters.memberId);
      if (filters.categoryId && filters.categoryId !== 'all') params.append('categoryId', filters.categoryId);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.search) params.append('search', filters.search);
      params.append('page', String(page));
      params.append('limit', '30');

      const res = await api.get(`/expenses?${params.toString()}`);
      if (res.success) {
        setExpenses(res.expenses);
        setTotalCount(res.summary.totalCount);
        setTotalAmount(res.summary.totalAmount);
        setTotalPages(res.summary.totalPages);
      }
    } catch (err) {
      console.error('Fetch expenses error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, refreshTrigger]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const handleExport = () => {
    if (!expenses.length) return;
    const exportData = expenses.map((e) => ({
      'ID': e.id,
      'Expense Title': e.title,
      'Category': e.category_name,
      'Amount (INR)': e.amount,
      'Paid By': e.paid_by_name,
      'Where / Shop': e.location || '',
      'Expense Date (IST)': e.expense_date,
      'Expense Time (IST)': e.expense_time,
      'Added By': e.created_by_name,
      'Created At (IST)': e.created_at_ist,
    }));
    exportToCSV(`whitehouse_expenses_${Date.now()}.csv`, exportData);
    showToast('Exported expenses to CSV!', 'success');
  };

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Expense History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Transparent breakdown of all shared household transactions
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

      {/* Filter Bar */}
      <ExpenseFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onExport={handleExport}
      />

      {/* Stats Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filtered Results:</span>
          <Badge variant="brand" size="md">
            {totalCount} transaction(s)
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Total Filtered Amount:</span>
          <span className="text-lg font-black text-slate-900">
            {formatCurrency(totalAmount, currency)}
          </span>
        </div>
      </div>

      {/* Responsive View: Desktop Table + Mobile Cards */}
      <Card className="p-0 overflow-hidden">
        {/* Mobile View (Cards) */}
        <div className="block md:hidden p-4 space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No expenses matched your filter.</p>
              <p className="text-xs text-slate-400">Try adjusting your search or date filter.</p>
            </div>
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

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Expense</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Paid By</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Where</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Time (IST)</th>
                <th className="py-3.5 px-4">Added By</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No expenses found.</p>
                    <p className="text-xs text-slate-400">Clear your filters or log a new expense.</p>
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
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {exp.paid_by_name}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExpense(exp);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 group-hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs">
            <span className="text-slate-500">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total items)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      <ExpenseDetailsModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onEdit={(exp) => {
          setSelectedExpense(null);
          setEditingExpense(exp);
        }}
      />

      {/* Edit Modal */}
      <ExpenseFormModal
        isOpen={!!editingExpense}
        initialExpense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSuccess={() => {
          triggerRefresh();
          showToast('Expense updated successfully!', 'success');
        }}
      />
    </div>
  );
};
