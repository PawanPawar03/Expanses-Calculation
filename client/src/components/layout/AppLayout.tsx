import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import { useApp } from '../../context/AppContext';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAddExpenseModalOpen, closeAddExpenseModal, triggerRefresh, showToast } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Top Header */}
      <TopNav onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Global Add Expense Modal */}
      <ExpenseFormModal
        isOpen={isAddExpenseModalOpen}
        onClose={closeAddExpenseModal}
        onSuccess={() => {
          triggerRefresh();
          showToast('Expense added successfully!', 'success');
        }}
      />

      {/* Toast Notification Stack */}
      <ToastContainer />
    </div>
  );
};
