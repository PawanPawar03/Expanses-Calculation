import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getTodayISTDateString, getCurrentISTTimeString } from '../../lib/time';
import { api } from '../../lib/api';
import { Expense } from '../../types';

export interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialExpense?: Expense | null; // If provided, edit mode
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialExpense,
}) => {
  const { user } = useAuth();
  const { categories, members, settings } = useApp();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paidByUserId, setPaidByUserId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(getTodayISTDateString());
  const [expenseTime, setExpenseTime] = useState(getCurrentISTTimeString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prevOpenRef = useRef(false);
  const prevExpenseIdRef = useRef<number | undefined>(undefined);

  // Initialize form state ONLY on modal open or when editing a different expense record
  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    const expenseChanged = initialExpense?.id !== prevExpenseIdRef.current;

    if (isOpen && (justOpened || expenseChanged)) {
      setError(null);
      if (initialExpense) {
        setTitle(initialExpense.title || '');
        setAmount(initialExpense.amount ? String(initialExpense.amount) : '');
        setCategoryId(initialExpense.category_id ? String(initialExpense.category_id) : '');
        setPaidByUserId(initialExpense.paid_by_user_id ? String(initialExpense.paid_by_user_id) : '');
        setLocation(initialExpense.location || '');
        setDescription(initialExpense.description || '');
        setExpenseDate(initialExpense.expense_date || getTodayISTDateString());
        setExpenseTime(initialExpense.expense_time || getCurrentISTTimeString());
      } else {
        // Reset to initial clean fields
        setTitle('');
        setAmount('');
        setCategoryId(categories[0]?.id ? String(categories[0].id) : '');
        setPaidByUserId(user?.id ? String(user.id) : (members[0]?.id ? String(members[0].id) : ''));
        setLocation('');
        setDescription('');
        setExpenseDate(getTodayISTDateString());
        setExpenseTime(getCurrentISTTimeString());
      }
    }

    prevOpenRef.current = isOpen;
    prevExpenseIdRef.current = initialExpense?.id;
  }, [isOpen, initialExpense]); // Removed categories & members from deps to prevent auto-resetting while typing

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Please provide an expense title or item name.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }
    if (!paidByUserId) {
      setError('Please select who paid for this expense.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: title.trim(),
        amount: parsedAmount,
        categoryId: parseInt(categoryId, 10),
        paidByUserId: parseInt(paidByUserId, 10),
        location: location.trim() || null,
        description: description.trim() || null,
        expenseDate,
        expenseTime,
      };

      if (initialExpense) {
        await api.put(`/expenses/${initialExpense.id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Submit expense error:', err);
      setError(err.message || 'Failed to save expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currency = settings.currencySymbol || '₹';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialExpense ? 'Edit Expense' : 'Add New Expense'}
      subtitle={
        initialExpense
          ? `Editing record #${initialExpense.id}`
          : 'Record a shared household expense with instant IST audit tracking'
      }
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {initialExpense ? 'Save Changes' : 'Submit Expense'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Expense Title */}
          <div className="sm:col-span-2">
            <Input
              label="Expense Item / Title"
              placeholder="e.g. Chapati & Dinner, Fresh Milk, Electricity Bill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Amount */}
          <div>
            <Input
              label={`Amount (${currency})`}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="120 or 120.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              prefixIcon={<span className="font-bold text-slate-500 text-sm">{currency}</span>}
              required
            />
          </div>

          {/* Paid By */}
          <div>
            <Select
              label="Paid By (Payer)"
              value={paidByUserId}
              onChange={(e) => setPaidByUserId(e.target.value)}
              required
            >
              <option value="">Select Member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.id === user?.id ? '(You)' : ''}
                </option>
              ))}
            </Select>
          </div>

          {/* Category */}
          <div>
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              {categories
                .filter((c) => c.status === 'ACTIVE' || String(c.id) === categoryId)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </Select>
          </div>

          {/* Where / Shop */}
          <div>
            <Input
              label="Where / Shop / Platform"
              placeholder="e.g. ABC Restaurant, D-Mart, MSEB"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Expense Date */}
          <div>
            <Input
              label="Expense Date (IST)"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
          </div>

          {/* Expense Time */}
          <div>
            <Input
              label="Expense Time (IST)"
              placeholder="e.g. 04:05 PM"
              value={expenseTime}
              onChange={(e) => setExpenseTime(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              rows={2}
              placeholder="Additional notes, item details, or split references..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Audit Meta Note */}
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            Added by: <strong className="text-slate-700">{user?.name}</strong>
          </span>
          <span className="font-mono">Timezone: Asia/Kolkata (IST)</span>
        </div>
      </form>
    </Modal>
  );
};
