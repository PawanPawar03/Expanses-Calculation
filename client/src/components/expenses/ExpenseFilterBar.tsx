import React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Search, Filter, Download, RotateCcw, Calendar } from 'lucide-react';

export interface FilterState {
  preset: string;
  startDate: string;
  endDate: string;
  memberId: string;
  categoryId: string;
  sortBy: string;
  search: string;
}

export interface ExpenseFilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  onExport?: () => void;
  hideMemberFilter?: boolean;
}

export const ExpenseFilterBar: React.FC<ExpenseFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  onExport,
  hideMemberFilter = false,
}) => {
  const { categories, members } = useApp();

  const presets = [
    { key: '', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7days', label: 'Last 7 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs space-y-3.5">
      {/* Top row: Date Presets & Export */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date:
          </span>
          {presets.map((p) => {
            const isActive = filters.preset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onFilterChange({ preset: p.key, startDate: '', endDate: '' })}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={onExport}
            >
              Export CSV
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={onReset}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Second row: Search & Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3">
        {/* Search */}
        <div className="lg:col-span-4">
          <Input
            placeholder="Search expense, shop, description..."
            prefixIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>

        {/* Member Filter */}
        {!hideMemberFilter && (
          <div className="lg:col-span-3">
            <Select
              value={filters.memberId}
              onChange={(e) => onFilterChange({ memberId: e.target.value })}
            >
              <option value="all">All Members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Category Filter */}
        <div className={hideMemberFilter ? 'lg:col-span-4' : 'lg:col-span-3'}>
          <Select
            value={filters.categoryId}
            onChange={(e) => onFilterChange({ categoryId: e.target.value })}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Sort Order */}
        <div className={hideMemberFilter ? 'lg:col-span-4' : 'lg:col-span-2'}>
          <Select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest ₹ Amount</option>
            <option value="amount_asc">Lowest ₹ Amount</option>
          </Select>
        </div>
      </div>
    </div>
  );
};
