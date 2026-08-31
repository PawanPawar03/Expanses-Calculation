import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyDataPoint } from '../../types';
import { formatCurrency } from '../../lib/time';
import { useApp } from '../../context/AppContext';

export interface MonthlyTrendChartProps {
  data: MonthlyDataPoint[];
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ data }) => {
  const { settings } = useApp();

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
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
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as MonthlyDataPoint;
                return (
                  <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-xs">
                    <p className="font-bold text-slate-900 mb-1">{item.month}</p>
                    <p className="text-emerald-600 font-extrabold text-sm">
                      {formatCurrency(item.total, settings.currencySymbol)}
                    </p>
                    <p className="text-slate-400 mt-0.5">{item.count} total expense(s)</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#monthlyGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
