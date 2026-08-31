import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
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
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const {
    settings,
    categories,
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

        {/* Categories Manager */}
        <Card className="lg:col-span-6 space-y-4">
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

          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                    <Badge variant={cat.status === 'ACTIVE' ? 'emerald' : 'rose'} size="sm">
                      {cat.status}
                    </Badge>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-slate-500">{cat.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditCategory(cat)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingCategory(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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
