import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { MemberReportItem, CategoryReportItem, MonthlyDataPoint } from '../../types';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MemberSpendingChart } from '../../components/charts/MemberSpendingChart';
import { CategoryPieChart } from '../../components/charts/CategoryPieChart';
import { MonthlyTrendChart } from '../../components/charts/MonthlyTrendChart';
import { formatCurrency } from '../../lib/time';
import { exportToCSV } from '../../lib/utils';
import { BarChart3, Download, Users, Tag, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserReportsPage: React.FC = () => {
  const { settings, refreshTrigger, showToast } = useApp();

  const [members, setMembers] = useState<MemberReportItem[]>([]);
  const [categories, setCategories] = useState<CategoryReportItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      try {
        const [memRes, catRes, monthRes] = await Promise.all([
          api.get('/reports/members'),
          api.get('/reports/categories'),
          api.get('/reports/monthly'),
        ]);

        if (memRes.success) {
          setMembers(memRes.members);
          setGrandTotal(memRes.grandTotal);
        }
        if (catRes.success) setCategories(catRes.categories);
        if (monthRes.success) setMonthlyData(monthRes.monthlyData);
      } catch (err) {
        console.error('Fetch reports error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, [refreshTrigger]);

  const handleExportMemberMatrix = () => {
    if (!members.length) return;
    const exportData = members.map((m) => ({
      'Member Name': m.name,
      'Email': m.email,
      'Role': m.role,
      'Status': m.status,
      'No. of Expenses': m.expenseCount,
      'Total Paid (INR)': m.totalPaid,
      'This Month Paid (INR)': m.thisMonthPaid,
      'Today Paid (INR)': m.todayPaid,
      'Percentage Share (%)': `${m.percentage}%`,
    }));
    exportToCSV(`whitehouse_member_summary_${Date.now()}.csv`, exportData);
    showToast('Exported member report to CSV!', 'success');
  };

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Financial & Member Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Real-time calculations of member contributions and spending trends
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={handleExportMemberMatrix}
          leftIcon={<Download className="w-4 h-4" />}
          className="shadow-xs font-bold self-start sm:self-auto"
        >
          Export Summary
        </Button>
      </div>

      {/* Overall Member Summary Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <CardTitle>Overall Member Contribution Summary</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of total paid, month-to-date, and today's share per member
            </p>
          </div>
          <Badge variant="brand" size="md">
            Grand Total: {formatCurrency(grandTotal, currency)}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4 text-center">No. of Expenses</th>
                <th className="py-3.5 px-4 text-right">Total Paid</th>
                <th className="py-3.5 px-4 text-right">This Month (IST)</th>
                <th className="py-3.5 px-4 text-right">Today (IST)</th>
                <th className="py-3.5 px-4 text-right">% Share</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <span>{m.name}</span>
                        <p className="text-[11px] text-slate-400 font-normal">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {m.expenseCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">
                    {formatCurrency(m.totalPaid, currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                    {formatCurrency(m.thisMonthPaid, currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                    {formatCurrency(m.todayPaid, currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-bold text-slate-800 text-xs">{m.percentage}%</span>
                      <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, m.percentage)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/members/${m.id}`}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Member Spending Comparison</CardTitle>
          </CardHeader>
          <MemberSpendingChart data={members} />
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Category Spend Distribution</CardTitle>
          </CardHeader>
          <CategoryPieChart data={categories} />
        </Card>

        <Card className="lg:col-span-12">
          <CardHeader>
            <CardTitle>Monthly Spend Trend (Current Year)</CardTitle>
          </CardHeader>
          <MonthlyTrendChart data={monthlyData} />
        </Card>
      </div>
    </div>
  );
};
