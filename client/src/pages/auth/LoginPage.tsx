import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Lock, Mail, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { settings, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password,
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
      }
    } catch (err: any) {
      console.error('Login failure:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: demoEmail,
        password: demoPass,
        rememberMe: true,
      });

      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        showToast(`Logged in as ${res.user.name} (${res.user.role})`, 'success');
        if (res.user.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
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
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Sign in to your account</h3>
            <p className="text-xs text-slate-500">Access shared household expenses and reports</p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Email Address / Username"
                type="email"
                placeholder="you@whitehouse.com"
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

          {/* Quick Demo 1-Click Logins */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              ⚡ Quick Demo 1-Click Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@whitehouse.com', 'admin123')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Admin (Full Access)
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('pawan@whitehouse.com', 'pawan123')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-all"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                Pawan (Member)
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('rahul@whitehouse.com', 'rahul123')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-100 transition-all"
              >
                Rahul
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('amit@whitehouse.com', 'amit123')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-100 transition-all"
              >
                Amit
              </button>
            </div>
          </div>

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
