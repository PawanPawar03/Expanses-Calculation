import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CategoryReportItem } from '../../types';
import { formatCurrency } from '../../lib/time';
import { useApp } from '../../context/AppContext';

export interface CategoryPieChartProps {
  data: CategoryReportItem[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b'];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  const { settings } = useApp();

  const activeData = data.filter((d) => d.total > 0);

  if (!activeData.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No category spending recorded yet.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={activeData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="total"
          >
            {activeData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as CategoryReportItem;
                return (
                  <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-xs">
                    <p className="font-bold text-slate-900 mb-0.5">{item.name}</p>
                    <p className="text-emerald-600 font-extrabold text-sm">
                      {formatCurrency(item.total, settings.currencySymbol)}
                    </p>
                    <p className="text-slate-500 mt-0.5">{item.percentage}% of overall spend</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
