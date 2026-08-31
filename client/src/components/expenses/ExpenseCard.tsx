import React from 'react';
import { Expense } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatISTDate } from '../../lib/time';
import { Badge } from '../ui/Badge';
import { MapPin, User, Calendar, Clock, Eye } from 'lucide-react';

export interface ExpenseCardProps {
  expense: Expense;
  onClick: (expense: Expense) => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onClick }) => {
  const { settings } = useApp();

  return (
    <div
      onClick={() => onClick(expense)}
      className="group relative rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm">
              {expense.category_name || 'Expense'}
            </Badge>
            {expense.location && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                <MapPin className="w-3 h-3 text-slate-400" />
                {expense.location}
              </span>
            )}
          </div>
          <h4 className="font-bold text-slate-900 text-base tracking-tight truncate group-hover:text-emerald-600 transition-colors">
            {expense.title}
          </h4>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-black text-slate-900 tracking-tight block">
            {formatCurrency(expense.amount, settings.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">{expense.expense_time}</span>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <div className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold flex items-center justify-center text-slate-600">
            {expense.paid_by_name?.charAt(0) || 'M'}
          </div>
          <span>Paid by <strong className="text-slate-900">{expense.paid_by_name}</strong></span>
        </div>

        <div className="flex items-center gap-1 font-mono text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatISTDate(expense.expense_date)}</span>
        </div>
      </div>
    </div>
  );
};
