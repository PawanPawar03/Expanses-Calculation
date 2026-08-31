import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { MemberReportItem, CategoryReportItem, MonthlyDataPoint, DailyDataPoint } from '../../types';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { MemberSpendingChart } from '../../components/charts/MemberSpendingChart';
import { CategoryPieChart } from '../../components/charts/CategoryPieChart';
import { MonthlyTrendChart } from '../../components/charts/MonthlyTrendChart';
import { DailyTrendChart } from '../../components/charts/DailyTrendChart';
import { TrendingUp, BarChart3, PieChart as PieIcon, Calendar, Activity } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const { refreshTrigger } = useApp();

  const [members, setMembers] = useState<MemberReportItem[]>([]);
  const [categories, setCategories] = useState<CategoryReportItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [dailyData, setDailyData] = useState<DailyDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      try {
        const [memRes, catRes, monthRes, dailyRes] = await Promise.all([
          api.get('/reports/members'),
          api.get('/reports/categories'),
          api.get('/reports/monthly'),
          api.get('/reports/daily'),
        ]);

        if (memRes.success) setMembers(memRes.members);
        if (catRes.success) setCategories(catRes.categories);
        if (monthRes.success) setMonthlyData(monthRes.monthlyData);
        if (dailyRes.success) setDailyData(dailyRes.days);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [refreshTrigger]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Financial Analytics & Insights
          </h1>
          <Badge variant="brand" size="sm">Live IST</Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Deep visual analytics on member spending, category breakdown, monthly and daily velocity
        </p>
      </div>

      {/* 4 Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Member-wise Spending */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <div>
                <CardTitle>Chart 1 — Member-wise Spending</CardTitle>
                <p className="text-xs text-slate-500">Total amount paid per household member</p>
              </div>
            </div>
          </CardHeader>
          <MemberSpendingChart data={members} />
        </Card>

        {/* Chart 2: Category-wise Spending */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle>Chart 2 — Category-wise Spending</CardTitle>
                <p className="text-xs text-slate-500">Distribution across Food, Rent, Grocery, etc.</p>
              </div>
            </div>
          </CardHeader>
          <CategoryPieChart data={categories} />
        </Card>

        {/* Chart 3: Monthly Expenses */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <CardTitle>Chart 3 — Monthly Expenses</CardTitle>
                <p className="text-xs text-slate-500">Month-over-month trend for the current year</p>
              </div>
            </div>
          </CardHeader>
          <MonthlyTrendChart data={monthlyData} />
        </Card>

        {/* Chart 4: Daily Expenses */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              <div>
                <CardTitle>Chart 4 — Daily Expenses</CardTitle>
                <p className="text-xs text-slate-500">Spending timeline across the past 14 days</p>
              </div>
            </div>
          </CardHeader>
          <DailyTrendChart data={dailyData} />
        </Card>
      </div>
    </div>
  );
};
