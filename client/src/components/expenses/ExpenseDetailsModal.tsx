import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatISTDate } from '../../lib/time';
import { Expense } from '../../types';
import {
  Receipt,
  User,
  MapPin,
  Calendar,
  Clock,
  FileText,
  ShieldAlert,
  Pencil,
  Trash2,
  Tag,
} from 'lucide-react';

export interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  isOpen,
  onClose,
  expense,
  onEdit,
  onDelete,
}) => {
  const { user, isAdmin } = useAuth();
  const { settings } = useApp();

  if (!expense) return null;

  const canEdit = isAdmin || user?.id === expense.created_by_user_id;
  const canDelete = isAdmin;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expense Details"
      subtitle={`Transaction ID #${expense.id}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => onDelete?.(expense)}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {canEdit && (
              <Button
                variant="brand"
                size="sm"
                leftIcon={<Pencil className="w-4 h-4" />}
                onClick={() => onEdit?.(expense)}
              >
                Edit Expense
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Main Banner with Amount and Title */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                {expense.category_name || 'Expense'}
              </span>
              <h2 className="text-xl font-bold mt-0.5 tracking-tight">{expense.title}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Total Amount</span>
              <p className="text-2xl font-black text-white tracking-tight">
                {formatCurrency(expense.amount, settings.currencySymbol)}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Grid Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
          {/* Paid By */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Paid By (Payer)
            </div>
            <p className="font-bold text-slate-900">{expense.paid_by_name || 'Member'}</p>
            {expense.paid_by_email && (
              <p className="text-xs text-slate-500 truncate">{expense.paid_by_email}</p>
            )}
          </div>

          {/* Category */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              Category
            </div>
            <p className="font-bold text-slate-900">{expense.category_name || 'General'}</p>
            <p className="text-xs text-slate-500">Shared Household</p>
          </div>

          {/* Where / Shop */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Where / Place
            </div>
            <p className="font-bold text-slate-900">{expense.location || 'Not Specified'}</p>
          </div>

          {/* Expense Date & Time */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Expense Date & Time
            </div>
            <p className="font-bold text-slate-900">{formatISTDate(expense.expense_date)}</p>
            <p className="text-xs text-slate-500 font-mono">{expense.expense_time} IST</p>
          </div>
        </div>

        {/* Description */}
        {expense.description && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Description
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{expense.description}</p>
          </div>
        )}

        {/* Audit Trail Section */}
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-3.5 space-y-1.5 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span className="font-medium">Added By:</span>
            <span className="font-semibold text-slate-700">{expense.created_by_name || 'System'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Created At:</span>
            <span className="font-mono text-slate-700">{expense.created_at_ist || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Last Updated:</span>
            <span className="font-mono text-slate-700">{expense.updated_at_ist || '-'}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
