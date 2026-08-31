import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { AuditLog } from '../../types';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  History,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  User,
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter && actionFilter !== 'all') params.append('action', actionFilter);
      if (search) params.append('search', search);
      params.append('page', String(page));
      params.append('limit', '30');

      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.success) {
        setLogs(res.logs);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, search, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleReset = () => {
    setActionFilter('all');
    setSearch('');
    setPage(1);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('CREATE') || action.includes('REGISTER')) return 'emerald';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'amber';
    if (action.includes('DELETE') || action.includes('DEACTIVATE')) return 'rose';
    if (action.includes('LOGIN')) return 'blue';
    return 'slate';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Audit Trail
          </h1>
          <Badge variant="brand" size="sm">Admin</Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Immutable audit record of all transactions, member edits, and system changes with IST timestamps
        </p>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <Input
              placeholder="Search user, action, item, or keyword..."
              prefixIcon={<Search className="w-4 h-4 text-slate-400" />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Actions</option>
              <option value="CREATE_EXPENSE">CREATE_EXPENSE</option>
              <option value="UPDATE_EXPENSE">UPDATE_EXPENSE</option>
              <option value="DELETE_EXPENSE">DELETE_EXPENSE</option>
              <option value="ADMIN_CREATE_USER">ADMIN_CREATE_USER</option>
              <option value="UPDATE_USER">UPDATE_USER</option>
              <option value="ADMIN_DELETE_USER">ADMIN_DELETE_USER</option>
              <option value="USER_REGISTER">USER_REGISTER</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="ADMIN_UPDATE_SETTINGS">ADMIN_UPDATE_SETTINGS</option>
            </Select>
          </div>

          <div className="sm:col-span-2 flex items-center">
            <Button
              variant="ghost"
              size="md"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="w-full"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Triggered By</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Event Details & Description</th>
                <th className="py-3.5 px-4 text-right">Timestamp (IST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No audit logs found.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {log.user_name || 'System'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                      {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 max-w-md leading-relaxed">
                      {log.details || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs font-mono text-slate-500 whitespace-nowrap">
                      {log.created_at_ist}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs">
            <span className="text-slate-500">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} logged events)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
