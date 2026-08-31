import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatLiveISTClock } from '../../lib/time';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Menu,
  PlusCircle,
  Clock,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export interface TopNavProps {
  onToggleSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const { settings, openAddExpenseModal } = useApp();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>(formatLiveISTClock());
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatLiveISTClock());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md transition-all">
      {/* Left: Mobile Toggle & App Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm group-hover:scale-105 transition-transform">
            <span className="font-black text-base tracking-tighter">W</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors uppercase">
                {settings.websiteName || 'Whitehouse'}
              </span>
              {isAdmin && (
                <Badge variant="brand" size="sm" className="hidden sm:inline-flex gap-1 py-0.5">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </Badge>
              )}
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 font-medium tracking-tight -mt-0.5">
              {settings.tagline || 'Simple. Transparent. Shared Expenses.'}
            </p>
          </div>
        </Link>
      </div>

      {/* Center: Live IST Clock */}
      <div className="hidden xl:flex items-center gap-2 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-2xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs font-semibold text-slate-700 font-mono tracking-tight">{currentTime}</span>
      </div>

      {/* Right: Quick Actions & Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Quick Add Expense Button */}
        <Button
          variant="brand"
          size="sm"
          onClick={openAddExpenseModal}
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="shadow-xs font-semibold"
        >
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Add</span>
        </Button>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-1.5 pr-2.5 text-left hover:bg-slate-100 focus:outline-none transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-white uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white py-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="border-b border-slate-100 px-4 py-2.5">
                  <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1.5">
                    <Badge variant={isAdmin ? 'brand' : 'slate'} size="sm">
                      {user?.role}
                    </Badge>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    My Profile
                  </Link>
                  {isAdmin ? (
                    <Link
                      to="/admin/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      App Settings
                    </Link>
                  ) : null}
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
