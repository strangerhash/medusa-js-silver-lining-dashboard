import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiService } from '../utils/api';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  UsersIcon, 
  CurrencyRupeeIcon, 
  CreditCardIcon, 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  CogIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface DashboardData {
  totalUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  userGrowth: number;
  revenueGrowth: number;
  transactionGrowth: number;
  avgTransactionGrowth: number;
  recentTransactions: any[];
  monthlyData: any[];
  platformHealth: any[];
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [analytics, transactions] = await Promise.all([
          apiService.getDashboardAnalytics(),
          apiService.getTransactions()
        ]);

        // Transform the data to match our interface
        const data: DashboardData = {
          totalUsers: analytics.overview?.totalUsers || 0,
          totalRevenue: analytics.revenue?.totalRevenue || 0,
          totalTransactions: analytics.overview?.totalTransactions || 0,
          averageTransaction: analytics.overview?.averageTransactionValue || 0,
          userGrowth: analytics.users?.userGrowth || 0,
          revenueGrowth: analytics.revenue?.revenueGrowth || 0,
          transactionGrowth: 0, // Not provided by backend yet
          avgTransactionGrowth: 0, // Not provided by backend yet
          recentTransactions: transactions.transactions?.slice(0, 5) || [],
          monthlyData: analytics.monthlyData || [],
          platformHealth: analytics.platformHealth || []
        };

        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const overviewData = dashboardData ? [
    { 
      name: 'Total Users', 
      value: dashboardData.totalUsers, 
      change: dashboardData.userGrowth, 
      icon: UsersIcon,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      darkBgColor: 'from-blue-900/30 to-cyan-900/30'
    },
    { 
      name: 'Total Revenue', 
      value: dashboardData.totalRevenue, 
      change: dashboardData.revenueGrowth, 
      icon: CurrencyRupeeIcon,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
      darkBgColor: 'from-emerald-900/30 to-teal-900/30'
    },
    { 
      name: 'Total Transactions', 
      value: dashboardData.totalTransactions, 
      change: dashboardData.transactionGrowth, 
      icon: CreditCardIcon,
      color: 'from-purple-500 to-violet-500',
      bgColor: 'from-purple-50 to-violet-50',
      darkBgColor: 'from-purple-900/30 to-violet-900/30'
    },
    { 
      name: 'Avg Transaction', 
      value: dashboardData.averageTransaction, 
      change: dashboardData.avgTransactionGrowth, 
      icon: ChartBarIcon,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      darkBgColor: 'from-orange-900/30 to-red-900/30'
    },
  ] : [];

  const quickActions = [
    { name: 'Review KYC', icon: EyeIcon, href: '/kyc', color: 'from-blue-500 to-cyan-500' },
    { name: 'User Management', icon: UsersIcon, href: '/users', color: 'from-purple-500 to-violet-500' },
    { name: 'Generate Report', icon: DocumentTextIcon, href: '/reports', color: 'from-emerald-500 to-teal-500' },
    { name: 'System Settings', icon: CogIcon, href: '/settings', color: 'from-orange-500 to-red-500' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40';
      case 'pending':
        return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40';
      default:
        return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800/60';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'good':
        return 'text-blue-600 dark:text-blue-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-dark-secondary">Loading dashboard...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gradient mb-2">Dashboard Overview</h1>
            <p className="text-dark-tertiary text-lg">Welcome back! Here's what's happening with your platform today.</p>
          </motion.div>

          {/* Animated Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overviewData.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.6, type: 'spring' }}
                  className="premium-card p-6 flex flex-col items-start justify-between min-h-[160px] group"
                >
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.bgColor} dark:${item.darkBgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-6 w-6 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`} />
                    </div>
                    {item.change !== 0 && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        item.change > 0 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      }`}>
                        {item.change > 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                        {Math.abs(Number(item.change.toFixed(1)))}%
                      </span>
                    )}
                  </div>
                  
                  <div className="w-full">
                    <h3 className="text-dark-secondary font-medium text-sm mb-2">
                      {item.name}
                    </h3>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + idx * 0.1, duration: 0.5, type: 'spring' }}
                      className="text-3xl font-bold text-dark-primary"
                    >
                      {item.name === 'Total Revenue' || item.name === 'Avg Transaction'
                        ? formatCurrency(item.value)
                        : item.value.toLocaleString('en-IN')}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Animated Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
              className="premium-card p-8 lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-dark-primary">Revenue & Users Trend</h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-dark-secondary">Users</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                    <span className="text-dark-secondary">Revenue</span>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData?.monthlyData || []}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8, type: 'spring' }}
              className="premium-card p-6"
            >
              <h3 className="text-lg font-semibold text-dark-primary mb-6">Quick Actions</h3>
              <div className="space-y-4">
                {quickActions.map((action, idx) => {
                  const IconComponent = action.icon;
                  return (
                    <motion.a
                      key={action.name}
                      href={action.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + idx * 0.1, duration: 0.5 }}
                      className="flex items-center p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                    >
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} mr-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium text-dark-secondary">{action.name}</span>
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Recent Transactions & Platform Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8, type: 'spring' }}
              className="premium-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-dark-primary">Recent Transactions</h3>
                <a href="/transactions" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                  View all
                </a>
              </div>
              
              <div className="space-y-4">
                {dashboardData?.recentTransactions.map((transaction, idx) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + idx * 0.1, duration: 0.5 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mr-4">
                        <span className="text-white font-semibold text-sm">
                          {transaction.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-dark-primary">{transaction.user?.name || 'Unknown User'}</p>
                        <p className="text-sm text-dark-tertiary">{transaction.type} • {formatDate(transaction.transactionDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-dark-primary">{formatCurrency(transaction.amount)}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Platform Health */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8, type: 'spring' }}
              className="premium-card p-6"
            >
              <h3 className="text-lg font-semibold text-dark-primary mb-6">Platform Health</h3>
              <div className="space-y-4">
                {dashboardData?.platformHealth.map((health, idx) => (
                  <motion.div
                    key={health.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + idx * 0.1, duration: 0.5 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <div>
                      <p className="font-medium text-dark-primary">{health.name}</p>
                      <p className="text-sm text-dark-tertiary">Last updated: {formatDate(health.lastUpdated)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getHealthStatusColor(health.status)}`}>{health.value}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        health.change > 0 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      }`}>
                        {health.change > 0 ? '+' : ''}{Number(health.change.toFixed(1))}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Dashboard; 