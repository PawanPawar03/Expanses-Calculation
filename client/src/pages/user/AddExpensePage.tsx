import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { getTodayISTDateString, getCurrentISTTimeString } from '../../lib/time';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { PlusCircle, ArrowLeft, Receipt, CheckCircle2 } from 'lucide-react';

export const AddExpensePage: React.FC = () => {
  const { user } = useAuth();
  const { categories, members, settings, showToast, triggerRefresh } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ? String(categories[0].id) : '');
  const [paidByUserId, setPaidByUserId] = useState(user?.id ? String(user.id) : '');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(getTodayISTDateString());
  const [expenseTime, setExpenseTime] = useState(getCurrentISTTimeString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Please provide an expense title.');
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
      await api.post('/expenses', {
        title: title.trim(),
        amount: parsedAmount,
        categoryId: parseInt(categoryId, 10),
        paidByUserId: parseInt(paidByUserId, 10),
        location: location.trim() || null,
        description: description.trim() || null,
        expenseDate,
        expenseTime,
      });

      triggerRefresh();
      showToast('Expense logged successfully!', 'success');
      navigate('/expenses');
    } catch (err: any) {
      console.error('Create expense error:', err);
      setError(err.message || 'Failed to add expense.');
    } finally {
      setIsLoading(false);
    }
  };

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <Card className="p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Record Shared Expense</h1>
              <p className="text-xs text-slate-500 font-medium">
                Log a new household item with automatic IST timestamp tracking
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Expense Item / Title"
              placeholder="e.g. Chapati & Dinner, Milk, Groceries, Electricity Bill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <Select
                label="Category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories
                  .filter((c) => c.status === 'ACTIVE')
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </Select>
            </div>

            <div>
              <Input
                label="Where / Shop / Platform"
                placeholder="e.g. ABC Restaurant, D-Mart"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Expense Date (IST)"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Expense Time (IST)"
                placeholder="e.g. 04:05 PM"
                value={expenseTime}
                onChange={(e) => setExpenseTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              rows={3}
              placeholder="Any additional notes about this expense..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Added By: <strong className="text-slate-700">{user?.name}</strong></span>
            <span className="font-mono">Timezone: Asia/Kolkata (IST)</span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="md" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="font-bold shadow-md"
              isLoading={isLoading}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit Expense
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
