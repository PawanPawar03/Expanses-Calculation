import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Expense } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ExpenseFilterBar, FilterState } from '../../components/expenses/ExpenseFilterBar';
import { ExpenseDetailsModal } from '../../components/expenses/ExpenseDetailsModal';
import { ExpenseFormModal } from '../../components/expenses/ExpenseFormModal';
import { formatCurrency, formatISTDate } from '../../lib/time';
import { exportToCSV } from '../../lib/utils';
import {
  Receipt,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
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

export const AdminExpensesPage: React.FC = () => {
  const { settings, openAddExpenseModal, refreshTrigger, triggerRefresh, showToast } = useApp();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      params.append('limit', '40');

      const res = await api.get(`/expenses?${params.toString()}`);
      if (res.success) {
        setExpenses(res.expenses);
        setTotalCount(res.summary.totalCount);
        setTotalAmount(res.summary.totalAmount);
        setTotalPages(res.summary.totalPages);
      }
    } catch (err) {
      console.error('Fetch admin expenses error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, refreshTrigger]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/expenses/${deletingExpense.id}`);
      if (res.success) {
        showToast('Expense deleted successfully', 'success');
        setDeletingExpense(null);
        setSelectedExpense(null);
        triggerRefresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!expenses.length) return;
    const exportData = expenses.map((e) => ({
      'ID': e.id,
      'Title': e.title,
      'Category': e.category_name,
      'Amount (INR)': e.amount,
      'Paid By': e.paid_by_name,
      'Paid By Email': e.paid_by_email,
      'Where': e.location || '',
      'Expense Date (IST)': e.expense_date,
      'Expense Time (IST)': e.expense_time,
      'Added By': e.created_by_name,
      'Created At (IST)': e.created_at_ist,
    }));
    exportToCSV(`whitehouse_master_expenses_${Date.now()}.csv`, exportData);
    showToast('Exported master expenses to CSV!', 'success');
  };

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Master Expense Management
            </h1>
            <Badge variant="brand" size="sm">Admin</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Full administrative control over shared household expense records
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
        onFilterChange={(newF) => {
          setFilters((prev) => ({ ...prev, ...newF }));
          setPage(1);
        }}
        onReset={() => {
          setFilters(initialFilters);
          setPage(1);
        }}
        onExport={handleExport}
      />

      {/* Summary Stat */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Total Count:</span>
          <Badge variant="brand" size="md">{totalCount} item(s)</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filtered Spend:</span>
          <span className="text-lg font-black text-slate-900">
            {formatCurrency(totalAmount, currency)}
          </span>
        </div>
      </div>

      {/* Main Admin Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Expense</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Paid By</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Where</th>
                <th className="py-3.5 px-4">Expense Date</th>
                <th className="py-3.5 px-4">Time (IST)</th>
                <th className="py-3.5 px-4">Added By</th>
                <th className="py-3.5 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No expenses match the filter criteria.</p>
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
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedExpense(exp)}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingExpense(exp)}
                          title="Edit Expense"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingExpense(exp)}
                          title="Delete Expense"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs">
            <span className="text-slate-500">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} items)
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

      {/* Modals */}
      <ExpenseDetailsModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onEdit={(exp) => {
          setSelectedExpense(null);
          setEditingExpense(exp);
        }}
        onDelete={(exp) => {
          setDeletingExpense(exp);
        }}
      />

      <ExpenseFormModal
        isOpen={!!editingExpense}
        initialExpense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSuccess={() => {
          triggerRefresh();
          showToast('Expense updated successfully', 'success');
        }}
      />

      <ConfirmModal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message={`Are you sure you want to delete "${deletingExpense?.title}" (${formatCurrency(deletingExpense?.amount || 0, currency)})? This will record a soft delete in the system.`}
        confirmText="Delete Expense"
        isLoading={isDeleting}
      />
    </div>
  );
};
