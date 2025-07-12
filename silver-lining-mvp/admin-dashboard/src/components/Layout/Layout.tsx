import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useToast } from '../../contexts/ToastContext';

interface LayoutProps {
  children: React.ReactNode;
}

const ToastDisplay: React.FC = () => {
  const { toasts, hideToast } = useToast();

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          hideToast(toast.id);
        }, toast.duration);
        
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, hideToast]);

  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 animate-in slide-in-from-right ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : toast.type === 'warning'
              ? 'bg-yellow-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => hideToast(toast.id)}
              className="ml-2 text-white hover:text-gray-200 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-all duration-700">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <main className="lg:ml-64 min-h-screen">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
      
      <ToastDisplay />
    </div>
  );
};

export default Layout; 