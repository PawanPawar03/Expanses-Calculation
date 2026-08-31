import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UserPlus, ArrowLeft, CheckCircle2, ShieldCheck, Mail, Lock, User, Phone } from 'lucide-react';

export const AdminAddMemberPage: React.FC = () => {
  const { showToast, triggerRefresh } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/users', {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim() || null,
        password,
        role,
        status,
      });

      if (res.success) {
        triggerRefresh();
        showToast(`Member ${name} added successfully!`, 'success');
        navigate('/admin/members');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create member account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Members
      </button>

      <Card className="p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Add New Member</h1>
                <Badge variant="brand" size="sm">Admin Action</Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Create a member or admin account with assigned credentials
              </p>
            </div>
          </div>
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
              placeholder="e.g. Pawan Pawar, Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              prefixIcon={<User className="w-4 h-4" />}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Email Address"
                type="email"
                placeholder="name@whitehouse.com"
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
              <Select
                label="Account Role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="USER">USER (Normal Member)</option>
                <option value="ADMIN">ADMIN (Full Administrative Control)</option>
              </Select>
            </div>

            <div>
              <Select
                label="Account Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Initial Password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefixIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="md" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="font-bold shadow-md"
              isLoading={isLoading}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Create Member Account
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
