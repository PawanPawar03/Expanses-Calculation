import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  Users,
  BarChart3,
  TrendingUp,
  History,
  Settings,
  User,
  LogOut,
  Wallet,
  X,
  Sparkles,
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Add Expense', path: '/expenses/add', icon: PlusCircle },
    { label: 'My Expenses', path: '/my-expenses', icon: Wallet },
    { label: 'All Expenses', path: '/expenses', icon: Receipt },
    { label: 'Members', path: '/members', icon: Users },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Expenses', path: '/admin/expenses', icon: Receipt },
    { label: 'Add Expense', path: '/expenses/add', icon: PlusCircle },
    { label: 'Members', path: '/admin/members', icon: Users },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Analytics', path: '/admin/analytics', icon: TrendingUp },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: History },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-slate-200/80 bg-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
              W
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight uppercase">Whitehouse</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Heading */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isAdmin ? 'Admin Console' : 'Member Workspace'}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === '/dashboard' || item.path === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-4.5 h-4.5 transition-colors',
                        isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                      )}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at bottom */}
        <div className="border-t border-slate-100 p-3.5 bg-slate-50/50">
          <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200/60 shadow-2xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-white uppercase">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden text-left">
                <p className="truncate text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="truncate text-[10px] text-slate-500 font-medium">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
