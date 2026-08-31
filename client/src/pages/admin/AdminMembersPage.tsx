import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { User } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { formatCurrency, formatISTDate } from '../../lib/time';
import {
  Users,
  UserPlus,
  Eye,
  Pencil,
  Trash2,
  Power,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';

export const AdminMembersPage: React.FC = () => {
  const { settings, refreshTrigger, triggerRefresh, showToast } = useApp();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'USER'>('USER');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editPassword, setEditPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [deletingMember, setDeletingMember] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadMembers() {
      setIsLoading(true);
      try {
        const res = await api.get('/users');
        if (res.success) {
          setMembers(res.users);
        }
      } catch (err) {
        console.error('Fetch members error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMembers();
  }, [refreshTrigger]);

  const handleOpenEdit = (m: User) => {
    setEditingMember(m);
    setEditName(m.name);
    setEditEmail(m.email);
    setEditMobile(m.mobile || '');
    setEditRole(m.role);
    setEditStatus(m.status);
    setEditPassword('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsUpdating(true);
    try {
      const payload: any = {
        name: editName.trim(),
        email: editEmail.trim(),
        mobile: editMobile.trim() || null,
        role: editRole,
        status: editStatus,
      };
      if (editPassword) {
        payload.password = editPassword;
      }

      const res = await api.put(`/users/${editingMember.id}`, payload);
      if (res.success) {
        showToast('Member profile updated successfully', 'success');
        setEditingMember(null);
        triggerRefresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update member', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStatus = async (m: User) => {
    const newStatus = m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.patch(`/users/${m.id}/status`, { status: newStatus });
      if (res.success) {
        showToast(`Member marked as ${newStatus}`, 'success');
        triggerRefresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/users/${deletingMember.id}`);
      if (res.success) {
        showToast('Member deleted successfully', 'success');
        setDeletingMember(null);
        triggerRefresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete member', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Member Management
            </h1>
            <Badge variant="brand" size="sm">Admin</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage household users, assign roles, activate/deactivate accounts
          </p>
        </div>

        <Link to="/admin/members/add">
          <Button
            variant="brand"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="shadow-sm font-bold self-start sm:self-auto"
          >
            Add Member
          </Button>
        </Link>
      </div>

      {/* Members Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Total Paid</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.map((m) => {
                const isSelf = m.id === currentUser?.id;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <span>{m.name}</span>
                          {isSelf && <span className="text-xs text-emerald-600 font-semibold ml-1.5">(You)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                      {m.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={m.role === 'ADMIN' ? 'brand' : 'slate'} size="sm">
                        {m.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={m.status === 'ACTIVE' ? 'emerald' : 'rose'} size="sm">
                        {m.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatCurrency(m.total_paid || 0, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                      {formatISTDate(m.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View details */}
                        <button
                          onClick={() => navigate(`/admin/members/${m.id}`)}
                          title="View Profile & Expenses"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit member */}
                        <button
                          onClick={() => handleOpenEdit(m)}
                          title="Edit Member"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Toggle active / inactive */}
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleStatus(m)}
                            title={m.status === 'ACTIVE' ? 'Deactivate Member' : 'Activate Member'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              m.status === 'ACTIVE'
                                ? 'text-amber-500 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete member */}
                        {!isSelf && (
                          <button
                            onClick={() => setDeletingMember(m)}
                            title="Delete Member"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Member Modal */}
      {editingMember && (
        <Modal
          isOpen={true}
          onClose={() => setEditingMember(null)}
          title={`Edit Member: ${editingMember.name}`}
          subtitle="Update role, status, or reset credentials"
          maxWidth="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setEditingMember(null)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button variant="brand" size="sm" onClick={handleSaveEdit} isLoading={isUpdating}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <Input
                label="Full Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Email Address"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Mobile Number"
                type="tel"
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Select
                  label="Role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                >
                  <option value="USER">USER (Member)</option>
                  <option value="ADMIN">ADMIN (Full Control)</option>
                </Select>
              </div>

              <div>
                <Select
                  label="Status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Select>
              </div>
            </div>

            <div>
              <Input
                label="Reset Password (Optional)"
                type="password"
                placeholder="Leave blank to keep unchanged"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                helperText="Provide at least 6 characters if updating"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleDeleteMember}
        title="Delete Member"
        message={`Are you sure you want to delete "${deletingMember?.name}" (${deletingMember?.email})? All historical expenses paid by this member will be preserved safely in the database.`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
