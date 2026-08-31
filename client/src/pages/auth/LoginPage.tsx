import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { initMockDb } from '../../lib/mockApi';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, isAuthenticated, login } = useAuth();
  const { settings, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@whitehouse.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname;

  // Auto redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password: password.trim(),
        rememberMe,
      });

      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        
        // Role based redirection
        if (from) {
          navigate(from, { replace: true });
        } else if (res.user.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      console.error('Login failure:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const setCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  const handleResetCache = () => {
    try {
      localStorage.removeItem('wh_cloud_api_url');
      localStorage.removeItem('wh_deleted_user_emails');
      localStorage.removeItem('wh_mock_users');
      localStorage.removeItem('whitehouse_token');
      localStorage.removeItem('whitehouse_user');
      initMockDb();
      setEmail('admin@whitehouse.com');
      setPassword('admin123');
      setError(null);
      showToast('Cache refreshed! Ready to log in.', 'success');
    } catch (err) {
      console.error('Cache reset error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg mb-3">
          <span className="font-black text-2xl tracking-tighter">W</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
          {settings.websiteName || 'Whitehouse'}
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          {settings.tagline || 'Simple. Transparent. Shared Expenses.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Sign in to your account</h3>
              <p className="text-xs text-slate-500">Access shared household expenses and reports</p>
            </div>
            <button
              type="button"
              onClick={handleResetCache}
              title="Reset Cache / Fix Login"
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* 1-Click Quick Fill Presets */}
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/70 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Quick 1-Tap Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCredentials('admin@whitehouse.com', 'admin123')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left shadow-sm group"
              >
                <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Admin</p>
                  <p className="text-[10px] text-slate-400 font-mono">admin123</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCredentials('pawan@whitehouse.com', 'pawan123')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left shadow-sm group"
              >
                <div className="h-7 w-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Pawan</p>
                  <p className="text-[10px] text-slate-400 font-mono">pawan123</p>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium space-y-2">
              <p>{error}</p>
              <button
                type="button"
                onClick={handleResetCache}
                className="text-xs font-bold text-rose-800 underline hover:text-rose-950 block"
              >
                👉 Click here to Reset Cache & Fix Login Credentials
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Email Address / Username"
                type="text"
                placeholder="admin@whitehouse.com or admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefixIcon={<Mail className="w-4 h-4" />}
                required
                autoFocus
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefixIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-600 font-medium">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full font-bold shadow-md"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Registration link */}
          <div className="text-center pt-2 text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700">
              Register as New Member
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
