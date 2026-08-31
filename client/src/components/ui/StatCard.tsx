import React from 'react';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-emerald-50 text-emerald-600',
  trend,
  trendType = 'neutral',
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300 active:scale-[0.99]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
        <div className={cn('flex items-center justify-center w-12 h-12 rounded-xl shadow-xs shrink-0', iconBgColor)}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs">
          <span
            className={cn(
              'font-semibold',
              trendType === 'positive' && 'text-emerald-600',
              trendType === 'negative' && 'text-rose-600',
              trendType === 'neutral' && 'text-slate-600'
            )}
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};
