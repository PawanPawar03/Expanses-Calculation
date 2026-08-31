import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatISTDate } from '../../lib/time';
import { User, Mail, Phone, Lock, Save, KeyRound, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdatingProfile(true);
    try {
      const res = await api.put(`/users/${user?.id}`, {
        name: name.trim(),
        mobile: mobile.trim() || null,
      });

      if (res.success) {
        updateUser({ name: name.trim(), mobile: mobile.trim() || null });
        showToast('Profile updated successfully!', 'success');
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setProfileSuccess(null), 3000);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.success) {
        showToast('Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Profile & Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Manage your personal details and account credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-6 space-y-4">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                prefixIcon={<User className="w-4 h-4" />}
                required
              />
            </div>

            <div>
              <Input
                label="Email Address"
                value={user?.email || ''}
                prefixIcon={<Mail className="w-4 h-4" />}
                disabled
                helperText="Email is locked to your member account"
              />
            </div>

            <div>
              <Input
                label="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                prefixIcon={<Phone className="w-4 h-4" />}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Badge variant={user?.role === 'ADMIN' ? 'brand' : 'slate'}>
                Role: {user?.role}
              </Badge>
              <Badge variant="emerald">
                Status: {user?.status}
              </Badge>
              <span className="text-[11px] text-slate-400 font-mono ml-auto">
                Joined: {formatISTDate(user?.created_at)}
              </span>
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                variant="brand"
                size="md"
                className="w-full font-bold shadow-xs"
                isLoading={isUpdatingProfile}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card className="md:col-span-6 space-y-4">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>

          {passError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {passError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                prefixIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <div>
              <Input
                label="New Password"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                prefixIcon={<KeyRound className="w-4 h-4" />}
                required
              />
            </div>

            <div>
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                prefixIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full font-bold"
                isLoading={isChangingPass}
                leftIcon={<Lock className="w-4 h-4" />}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
