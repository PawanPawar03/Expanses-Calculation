import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Mail, Phone, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { settings, showToast } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-check.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim() || null,
        password,
      });

      if (res.success) {
        showToast('Registration successful! Please login with your credentials.', 'success');
        navigate('/login');
      }
    } catch (err: any) {
      console.error('Registration failure:', err);
      setError(err.message || 'Registration failed. Please try again.');
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
          Create a new household member account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Member Registration</h3>
            <p className="text-xs text-slate-500">
              Join the household to record & split shared expenses
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Full Name"
                placeholder="e.g. Pawan Pawar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                prefixIcon={<User className="w-4 h-4" />}
                required
                autoFocus
              />
            </div>

            <div>
              <Input
                label="Email Address"
                type="email"
                placeholder="pawan@whitehouse.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefixIcon={<Mail className="w-4 h-4" />}
                required
              />
            </div>

            <div>
              <Input
                label="Mobile Number (Optional)"
                type="tel"
                placeholder="+91 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                prefixIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefixIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <div>
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                prefixIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full font-bold shadow-md"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
