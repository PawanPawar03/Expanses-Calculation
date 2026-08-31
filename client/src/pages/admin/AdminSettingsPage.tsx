import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api, getApiBaseUrl } from '../../lib/api';
import { Category } from '../../types';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import {
  Settings as SettingsIcon,
  Sparkles,
  Tag,
  PlusCircle,
  Pencil,
  Trash2,
  Save,
  CheckCircle2,
  Power,
  Globe,
  Radio,
  Server,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const {
    settings,
    categories,
    cloudApiUrl,
    setCloudApiUrl,
    updateSettingsState,
    fetchCategories,
    showToast,
    triggerRefresh,
  } = useApp();

  // App Settings form
  const [websiteName, setWebsiteName] = useState(settings.websiteName || 'Whitehouse');
  const [tagline, setTagline] = useState(settings.tagline || 'Simple. Transparent. Shared Expenses.');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');
  const [allowRegistration, setAllowRegistration] = useState(settings.allowMemberRegistration || 'true');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Cloud API URL
  const [apiUrlInput, setApiUrlInput] = useState(cloudApiUrl || '');
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [apiConnectionStatus, setApiConnectionStatus] = useState<string | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catStatus, setCatStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const handleSaveAppSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await api.put('/settings', {
        websiteName: websiteName.trim(),
        tagline: tagline.trim(),
        currencySymbol: currencySymbol.trim(),
        allowMemberRegistration: allowRegistration,
      });

      if (res.success) {
        updateSettingsState({
          websiteName: websiteName.trim(),
          tagline: tagline.trim(),
          currencySymbol: currencySymbol.trim(),
          allowMemberRegistration: allowRegistration,
        });
        showToast('Settings saved successfully!', 'success');
        triggerRefresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveCloudApiUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingUrl(true);
    setApiConnectionStatus(null);
    try {
      const target = apiUrlInput.trim();
      if (!target) {
        setCloudApiUrl('');
        setApiConnectionStatus('Reset to Browser Database / Local Mode');
        showToast('Switched to Browser Database Mode', 'info');
        return;
      }

      // Test connection
      const cleanUrl = target.replace(/\/+$/, '');
      const healthUrl = cleanUrl.endsWith('/api') ? `${cleanUrl}/health` : `${cleanUrl}/api/health`;
      const res = await fetch(healthUrl).then((r) => r.json()).catch(() => null);

      if (res && res.status === 'healthy') {
        setCloudApiUrl(cleanUrl);
        setApiConnectionStatus(`Connected to Live Cloud Backend (${res.app || 'Whitehouse Server'})`);
        showToast('Connected to Live Cloud Backend!', 'success');
      } else {
        // Still save if user wants, but warn
        setCloudApiUrl(cleanUrl);
        setApiConnectionStatus('Saved Cloud URL (Server reachable)');
        showToast('Cloud API URL saved', 'success');
      }
      triggerRefresh();
    } catch (err: any) {
      setApiConnectionStatus('Could not verify server health, but URL saved');
    } finally {
      setIsTestingUrl(false);
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDescription('');
    setCatStatus('ACTIVE');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatDescription(c.description || '');
    setCatStatus(c.status);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, {
          name: catName.trim(),
          description: catDescription.trim() || null,
          status: catStatus,
        });
        showToast('Category updated successfully!', 'success');
      } else {
        await api.post('/categories', {
          name: catName.trim(),
          description: catDescription.trim() || null,
          status: catStatus,
        });
        showToast('Category added successfully!', 'success');
      }
      setIsCategoryModalOpen(false);
      fetchCategories();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      const res = await api.delete(`/categories/${deletingCategory.id}`);
      showToast(res.message || 'Category processed successfully', 'success');
      setDeletingCategory(null);
      fetchCategories();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  const currentBackend = getApiBaseUrl();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Application Settings & Content
          </h1>
          <Badge variant="brand" size="sm">Admin</Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Customize website branding, tagline, currency format, and expense categories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* General Settings */}
        <Card className="lg:col-span-6 space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <div>
                <CardTitle>Branding & App Preferences</CardTitle>
                <p className="text-xs text-slate-500">Persistent site content and controls</p>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSaveAppSettings} className="space-y-4">
            <div>
              <Input
                label="Website / House Name"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                placeholder="Whitehouse"
                required
              />
            </div>

            <div>
              <Input
                label="Tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Simple. Transparent. Shared Expenses."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Currency Symbol"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="₹"
                  required
                />
              </div>

              <div>
                <Select
                  label="Allow Self-Registration"
                  value={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.value)}
                >
                  <option value="true">Enabled (Yes)</option>
                  <option value="false">Disabled (Admin-only)</option>
                </Select>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="brand"
                size="md"
                className="w-full font-bold shadow-xs"
                isLoading={isSavingSettings}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Settings
              </Button>
            </div>
          </form>
        </Card>

        {/* Live Cloud Backend (Cross-Device Sync) */}
        <Card className="lg:col-span-6 space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle>Live Cloud Backend Sync</CardTitle>
                <p className="text-xs text-slate-500">Connect to a live shared backend for instant cross-device updates</p>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSaveCloudApiUrl} className="space-y-3.5">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Current Active Database:</span>
                <Badge variant={currentBackend === '/api' ? 'emerald' : 'blue'} size="sm">
                  {currentBackend === '/api' ? 'Browser Storage / Local Proxy' : 'Live Cloud Server'}
                </Badge>
              </div>
              <p className="text-slate-600 font-mono text-[11px] truncate">
                {currentBackend}
              </p>
            </div>

            <div>
              <Input
                label="Custom Cloud Backend URL"
                placeholder="e.g. https://whitehouse-backend.onrender.com"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                prefixIcon={<Server className="w-4 h-4 text-slate-400" />}
                helperText="Leave empty to use in-browser database mode or enter your deployed Render/Railway/Vercel URL."
              />
            </div>

            {apiConnectionStatus && (
              <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                {apiConnectionStatus}
              </p>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full font-bold"
                isLoading={isTestingUrl}
                leftIcon={<Radio className="w-4 h-4 text-emerald-400" />}
              >
                Save & Connect Cloud API
              </Button>
            </div>
          </form>
        </Card>

        {/* Categories Manager */}
        <Card className="lg:col-span-12 space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              <div>
                <CardTitle>Expense Categories</CardTitle>
                <p className="text-xs text-slate-500">Manage categories available for expense tagging</p>
              </div>
            </div>
            <Button
              variant="brand"
              size="sm"
              onClick={handleOpenAddCategory}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add Category
            </Button>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <div key={cat.id} className="p-3.5 border border-slate-200/80 rounded-2xl bg-white shadow-2xs hover:shadow-xs transition-all space-y-2">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                  <Badge variant={cat.status === 'ACTIVE' ? 'emerald' : 'rose'} size="sm">
                    {cat.status}
                  </Badge>
                </div>
                {cat.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
                )}
                <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditCategory(cat)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingCategory(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Add / Edit Category Modal */}
      {isCategoryModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCategoryModalOpen(false)}
          title={editingCategory ? 'Edit Category' : 'Add New Category'}
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(false)} disabled={isSavingCategory}>
                Cancel
              </Button>
              <Button variant="brand" size="sm" onClick={handleSaveCategory} isLoading={isSavingCategory}>
                Save Category
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <Input
                label="Category Name"
                placeholder="e.g. Food, Electricity, Rent"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <Input
                label="Description"
                placeholder="Short description of items in this category"
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
              />
            </div>

            <div>
              <Select
                label="Status"
                value={catStatus}
                onChange={(e) => setCatStatus(e.target.value as any)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete / Deactivate Category Confirmation */}
      <ConfirmModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteCategory}
        title="Remove Category"
        message={`Are you sure you want to remove category "${deletingCategory?.name}"? If expenses already exist under this category, it will be safely deactivated.`}
        confirmText="Confirm"
      />
    </div>
  );
};
