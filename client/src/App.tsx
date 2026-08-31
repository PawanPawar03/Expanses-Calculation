import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// User Pages
import { UserDashboard } from './pages/user/UserDashboard';
import { ExpensesPage } from './pages/user/ExpensesPage';
import { AddExpensePage } from './pages/user/AddExpensePage';
import { MyExpensesPage } from './pages/user/MyExpensesPage';
import { MembersPage } from './pages/user/MembersPage';
import { MemberDetailPage } from './pages/user/MemberDetailPage';
import { UserReportsPage } from './pages/user/UserReportsPage';
import { ProfilePage } from './pages/user/ProfilePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminExpensesPage } from './pages/admin/AdminExpensesPage';
import { AdminMembersPage } from './pages/admin/AdminMembersPage';
import { AdminAddMemberPage } from './pages/admin/AdminAddMemberPage';
import { AdminMemberDetailPage } from './pages/admin/AdminMemberDetailPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Protected Route Wrapper for Authenticated Users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading Whitehouse...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Admin Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Verifying privileges...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Root index redirect based on user role - redirects directly to /login if unauthenticated
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Root Redirect - Opens Login Page Directly */}
            <Route path="/" element={<RootRedirect />} />

            {/* User Protected Routes with AppLayout Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/expenses/add" element={<AddExpensePage />} />
              <Route path="/expenses/:id" element={<ExpensesPage />} />
              <Route path="/my-expenses" element={<MyExpensesPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/members/:id" element={<MemberDetailPage />} />
              <Route path="/reports" element={<UserReportsPage />} />
              <Route path="/reports/members" element={<UserReportsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Protected Routes with AppLayout Shell */}
            <Route
              element={
                <AdminRoute>
                  <AppLayout />
                </AdminRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/expenses" element={<AdminExpensesPage />} />
              <Route path="/admin/members" element={<AdminMembersPage />} />
              <Route path="/admin/members/add" element={<AdminAddMemberPage />} />
              <Route path="/admin/members/:id" element={<AdminMemberDetailPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Fallback Catch-all Route -> Login / Dashboard */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </HashRouter>
  );
};
