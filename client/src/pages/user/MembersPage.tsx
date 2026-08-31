import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { User } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatISTDate } from '../../lib/time';
import { Users, Mail, Phone, Calendar, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const MembersPage: React.FC = () => {
  const { settings, refreshTrigger } = useApp();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      setIsLoading(true);
      try {
        const res = await api.get('/users');
        if (res.success) {
          setMembers(res.users);
        }
      } catch (err) {
        console.error('Error fetching members:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMembers();
  }, [refreshTrigger]);

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Household Members
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Active members sharing flat expenses in Whitehouse
        </p>
      </div>

      {/* Grid of Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((member) => {
          const isSelf = member.id === currentUser?.id;
          return (
            <Card
              key={member.id}
              hoverEffect={true}
              onClick={() => navigate(`/members/${member.id}`)}
              className="cursor-pointer space-y-4 relative overflow-hidden group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-black text-lg group-hover:scale-105 transition-transform shadow-xs">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                      {member.name} {isSelf && <span className="text-xs text-emerald-600 font-semibold">(You)</span>}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant={member.role === 'ADMIN' ? 'brand' : 'slate'} size="sm">
                        {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                      </Badge>
                      <Badge variant={member.status === 'ACTIVE' ? 'emerald' : 'rose'} size="sm">
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.mobile && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.mobile}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined: {formatISTDate(member.created_at)}</span>
                </div>
              </div>

              {/* Total Contributed Banner */}
              <div className="rounded-xl bg-slate-50 p-3 flex items-center justify-between border border-slate-100 group-hover:bg-emerald-50/50 group-hover:border-emerald-100 transition-colors">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Paid</p>
                  <p className="text-base font-black text-slate-900">
                    {formatCurrency(member.total_paid || 0, currency)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                  <span>View History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
