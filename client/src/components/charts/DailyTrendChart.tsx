import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DailyDataPoint } from '../../types';
import { formatCurrency } from '../../lib/time';
import { useApp } from '../../context/AppContext';

export interface DailyTrendChartProps {
  data: DailyDataPoint[];
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({ data }) => {
  const { settings } = useApp();

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="displayDate"
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tick={{ fill: '#64748b', fontSize: 11 }}
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
                const item = payload[0].payload as DailyDataPoint;
                return (
                  <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-xs">
                    <p className="font-bold text-slate-900 mb-1">{item.date}</p>
                    <p className="text-emerald-600 font-extrabold text-sm">
                      {formatCurrency(item.total, settings.currencySymbol)}
                    </p>
                    <p className="text-slate-400 mt-0.5">{item.count} expense(s) on this day</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="total" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
