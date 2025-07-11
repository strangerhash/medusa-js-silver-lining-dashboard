import React from 'react';
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../components/Toast';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

function AppContent({ Component, pageProps }: { Component: AppProps['Component']; pageProps: any }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated and not on login page
  if (!user && router.pathname !== '/login') {
    router.push('/login');
    return null;
  }

  // Redirect to dashboard if authenticated and on login page
  if (user && router.pathname === '/login') {
    router.push('/');
    return null;
  }

  return <Component {...pageProps} />;
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppContent Component={Component} pageProps={pageProps} />
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default MyApp 