import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { MemberReportItem } from '../../types';
import { formatCurrency } from '../../lib/time';
import { useApp } from '../../context/AppContext';

export interface MemberSpendingChartProps {
  data: MemberReportItem[];
}

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

export const MemberSpendingChart: React.FC<MemberSpendingChartProps> = ({ data }) => {
  const { settings } = useApp();

  const formattedData = data.map((d) => ({
    name: d.name.split(' ')[0], // First name for neat axis
    fullName: d.name,
    total: d.totalPaid,
    count: d.expenseCount,
  }));

  if (!formattedData.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No member spending records found.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(val) => `${settings.currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-xs">
                    <p className="font-bold text-slate-900 mb-1">{item.fullName}</p>
                    <p className="text-emerald-600 font-extrabold text-sm">
                      {formatCurrency(item.total, settings.currencySymbol)}
                    </p>
                    <p className="text-slate-400 mt-0.5">{item.count} expense(s) logged</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={48}>
            {formattedData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
