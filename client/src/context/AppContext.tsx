import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppSettings, Category, User } from '../types';
import { api, getApiBaseUrl } from '../lib/api';
import { useAuth } from './AuthContext';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
  settings: AppSettings;
  categories: Category[];
  members: User[];
  toasts: Toast[];
  isAddExpenseModalOpen: boolean;
  refreshTrigger: number;
  cloudApiUrl: string;
  setCloudApiUrl: (url: string) => void;
  triggerRefresh: () => void;
  openAddExpenseModal: () => void;
  closeAddExpenseModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  updateSettingsState: (newSettings: Partial<AppSettings>) => void;
  fetchCategories: () => Promise<void>;
  fetchMembers: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  websiteName: 'Whitehouse',
  tagline: 'Simple. Transparent. Shared Expenses.',
  currencySymbol: '₹',
  allowMemberRegistration: 'true',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [cloudApiUrl, setCloudApiUrlState] = useState<string>(() => localStorage.getItem('wh_cloud_api_url') || '');

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const setCloudApiUrl = (url: string) => {
    setCloudApiUrlState(url);
    if (url.trim()) {
      localStorage.setItem('wh_cloud_api_url', url.trim());
    } else {
      localStorage.removeItem('wh_cloud_api_url');
    }
    triggerRefresh();
  };

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings');
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/categories');
      if (res.success && res.categories) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  }, [isAuthenticated]);

  const fetchMembers = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/users');
      if (res.success && res.users) {
        setMembers(res.users);
      }
    } catch (err) {
      console.error('Fetch members error:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchMembers();
    }
  }, [isAuthenticated, fetchCategories, fetchMembers, refreshTrigger]);

  // Real-time live polling & focus listener across devices/tabs
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (!isAddExpenseModalOpen) {
        triggerRefresh();
      }
    }, 8000); // Live poll every 8 seconds when modal is not open

    const handleFocus = () => {
      if (!isAddExpenseModalOpen) {
        triggerRefresh();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('wh_') && !isAddExpenseModalOpen) {
        triggerRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isAuthenticated, isAddExpenseModalOpen, triggerRefresh]);

  const updateSettingsState = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const openAddExpenseModal = () => setIsAddExpenseModalOpen(true);
  const closeAddExpenseModal = () => setIsAddExpenseModalOpen(false);

  return (
    <AppContext.Provider
      value={{
        settings,
        categories,
        members,
        toasts,
        isAddExpenseModalOpen,
        refreshTrigger,
        cloudApiUrl,
        setCloudApiUrl,
        triggerRefresh,
        openAddExpenseModal,
        closeAddExpenseModal,
        showToast,
        removeToast,
        updateSettingsState,
        fetchCategories,
        fetchMembers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
