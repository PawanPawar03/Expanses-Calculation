import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg mb-3">
          <span className="font-black text-2xl tracking-tighter">W</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reset Account Password</h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">Whitehouse Expense Management</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Password Reset Requested</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For security in household shared setups, please contact your house <strong>Admin</strong> (admin@whitehouse.com) or ask an administrator to reset your password from the Members panel.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="brand" size="sm" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered household email address to submit a password reset notice.
              </p>

              <div>
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="pawan@whitehouse.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  prefixIcon={<Mail className="w-4 h-4" />}
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" variant="brand" size="lg" className="w-full font-bold">
                Submit Reset Request
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
