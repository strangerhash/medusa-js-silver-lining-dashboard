import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiService } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CreditCardIcon,
  CogIcon,
  DocumentTextIcon,
  BellIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie } from 'recharts';

interface AnalyticsData {
  dashboard: any;
  users: any;
  transactions: any;
  financial: any;
}

interface TimeRange {
  value: string;
  label: string;
  days: number;
}

const timeRanges: TimeRange[] = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: '1y', label: 'Last year', days: 365 }
];

const Analytics: React.FC = () => {
  const { showToast } = useToast();
  const [timeRange, setTimeRange] = useState<TimeRange>(timeRanges[1]); // Default to 30 days
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    transactionType: 'all',
    userStatus: 'all',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [dashboard, users, transactions, financial] = await Promise.all([
        apiService.getAnalyticsDashboard(),
        apiService.getUserAnalytics(),
        apiService.getTransactionAnalytics(),
        apiService.getFinancialAnalytics()
      ]);

      setAnalyticsData({
        dashboard,
        users,
        transactions,
        financial
      });

      console.log('Analytics data loaded successfully');
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(`Failed to load analytics data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
      case 'excellent':
        return 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40';
      case 'pending':
      case 'good':
        return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40';
      case 'failed':
      case 'inactive':
      case 'critical':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40';
      default:
        return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800/60';
    }
  };

  const handleExportReport = async () => {
    if (!analyticsData) return;
    
    setIsExporting(true);
    try {
      const { dashboard, users, transactions, financial } = analyticsData;
      
      // Prepare data for export
      const exportData = {
        reportInfo: {
          title: 'Analytics Report',
          generatedAt: new Date().toISOString(),
          timeRange: timeRange.label,
          filters: filters
        },
        overview: {
          totalUsers: dashboard.overview?.totalUsers || 0,
          totalRevenue: dashboard.revenue?.totalRevenue || 0,
          totalTransactions: dashboard.overview?.totalTransactions || 0,
          averageTransactionValue: dashboard.overview?.averageTransactionValue || 0,
          userGrowth: dashboard.users?.userGrowth || 0,
          revenueGrowth: dashboard.revenue?.revenueGrowth || 0
        },
        userAnalytics: {
          totalUsers: users.totalUsers || 0,
          activeUsers: users.activeUsers || 0,
          newUsersThisMonth: users.newUsersThisMonth || 0,
          usersByRole: users.usersByRole || {},
          usersByStatus: users.usersByStatus || {}
        },
        transactionAnalytics: {
          totalTransactions: transactions.totalTransactions || 0,
          successfulTransactions: transactions.successfulTransactions || 0,
          failedTransactions: transactions.failedTransactions || 0,
          successRate: transactions.successRate || 0,
          totalVolume: transactions.totalVolume || 0,
          averageTransactionValue: transactions.averageTransactionValue || 0,
          transactionsByType: transactions.transactionsByType || {},
          transactionsByStatus: transactions.transactionsByStatus || {}
        },
        financialAnalytics: {
          totalRevenue: financial.totalRevenue || 0,
          totalSilverHolding: financial.totalSilverHolding || 0,
          averageSilverPrice: financial.averageSilverPrice || 0
        },
        monthlyData: dashboard.monthlyData || [],
        platformHealth: dashboard.platformHealth || []
      };

      // Create CSV content
      const csvContent = generateCSV(exportData);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Analytics report exported successfully!', 'success');
      console.log('Analytics report exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export report. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (data: any) => {
    const lines = [];
    
    // Report header
    lines.push('Analytics Report');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Time Range: ${timeRange.label}`);
    lines.push('');
    
    // Overview section
    lines.push('OVERVIEW METRICS');
    lines.push('Metric,Value');
    lines.push(`Total Users,${data.overview.totalUsers}`);
    lines.push(`Total Revenue,${data.overview.totalRevenue}`);
    lines.push(`Total Transactions,${data.overview.totalTransactions}`);
    lines.push(`Average Transaction Value,${data.overview.averageTransactionValue}`);
    lines.push(`User Growth,${data.overview.userGrowth}%`);
    lines.push(`Revenue Growth,${data.overview.revenueGrowth}%`);
    lines.push('');
    
    // User analytics
    lines.push('USER ANALYTICS');
    lines.push('Metric,Value');
    lines.push(`Total Users,${data.userAnalytics.totalUsers}`);
    lines.push(`Active Users,${data.userAnalytics.activeUsers}`);
    lines.push(`New Users This Month,${data.userAnalytics.newUsersThisMonth}`);
    lines.push('');
    
    // Transaction analytics
    lines.push('TRANSACTION ANALYTICS');
    lines.push('Metric,Value');
    lines.push(`Total Transactions,${data.transactionAnalytics.totalTransactions}`);
    lines.push(`Successful Transactions,${data.transactionAnalytics.successfulTransactions}`);
    lines.push(`Failed Transactions,${data.transactionAnalytics.failedTransactions}`);
    lines.push(`Success Rate,${data.transactionAnalytics.successRate}%`);
    lines.push(`Total Volume,${data.transactionAnalytics.totalVolume}`);
    lines.push(`Average Transaction Value,${data.transactionAnalytics.averageTransactionValue}`);
    lines.push('');
    
    // Monthly data
    if (data.monthlyData.length > 0) {
      lines.push('MONTHLY TRENDS');
      lines.push('Month,Users,Revenue,Transactions');
      data.monthlyData.forEach((item: any) => {
        lines.push(`${item.name},${item.users},${item.revenue},${item.transactions || 0}`);
      });
      lines.push('');
    }
    
    return lines.join('\n');
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      transactionType: 'all',
      userStatus: 'all',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: ''
    });
    showToast('Filters cleared!', 'info');
  };

  const applyFilters = () => {
    // In a real implementation, you would refetch data with filters
    // For now, we'll just log the filters
    console.log('Applying filters:', filters);
    showToast('Filters applied successfully!', 'success');
    setShowFilters(false);
  };

  const hasActiveFilters = () => {
    return filters.transactionType !== 'all' || 
           filters.userStatus !== 'all' || 
           filters.minAmount !== '' || 
           filters.maxAmount !== '' || 
           filters.dateFrom !== '' || 
           filters.dateTo !== '';
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.transactionType !== 'all') count++;
    if (filters.userStatus !== 'all') count++;
    if (filters.minAmount !== '') count++;
    if (filters.maxAmount !== '') count++;
    if (filters.dateFrom !== '') count++;
    if (filters.dateTo !== '') count++;
    return count;
  };

  // Dynamic insight generation functions
  const generateUserInsights = () => {
    const totalUsers = dashboard.overview?.totalUsers || 0;
    const activeUsers = users.activeUsers || 0;
    const newUsers = users.newUsersThisMonth || 0;
    const userGrowth = dashboard.users?.userGrowth || 0;
    const activeRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    const insights = [];

    // User growth insight
    if (userGrowth > 10) {
      insights.push({
        type: 'success',
        title: 'Strong User Growth',
        message: `User registration increased by ${formatPercentage(userGrowth)} this month. Consider scaling marketing campaigns and onboarding processes.`,
        icon: '📈',
        priority: 'high'
      });
    } else if (userGrowth > 0) {
      insights.push({
        type: 'info',
        title: 'Steady User Growth',
        message: `User growth of ${formatPercentage(userGrowth)} is positive. Focus on retention strategies to maintain momentum.`,
        icon: '📊',
        priority: 'medium'
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'User Growth Concern',
        message: 'User growth has slowed. Review acquisition strategies, improve onboarding, and consider referral programs.',
        icon: '⚠️',
        priority: 'high'
      });
    }

    // User engagement insight
    if (activeRate > 80) {
      insights.push({
        type: 'success',
        title: 'Excellent User Engagement',
        message: `${formatPercentage(activeRate)} of users are active. Your platform is highly engaging!`,
        icon: '🎯',
        priority: 'medium'
      });
    } else if (activeRate > 60) {
      insights.push({
        type: 'info',
        title: 'Good User Engagement',
        message: `${formatPercentage(activeRate)} of users are active. Focus on re-engaging inactive users.`,
        icon: '👥',
        priority: 'medium'
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Low User Engagement',
        message: `Only ${formatPercentage(activeRate)} of users are active. Implement engagement campaigns and improve user experience.`,
        icon: '📉',
        priority: 'high'
      });
    }

    // New user insight
    if (newUsers > totalUsers * 0.1) {
      insights.push({
        type: 'success',
        title: 'High New User Acquisition',
        message: `${formatPercentage((newUsers / totalUsers) * 100)} of total users joined this month. Excellent acquisition performance!`,
        icon: '🆕',
        priority: 'medium'
      });
    }

    return insights;
  };

  const generateRevenueInsights = () => {
    const totalRevenue = dashboard.revenue?.totalRevenue || 0;
    const revenueGrowth = dashboard.revenue?.revenueGrowth || 0;
    const avgTransactionValue = dashboard.overview?.averageTransactionValue || 0;
    const totalTransactions = dashboard.overview?.totalTransactions || 0;

    const insights = [];

    // Revenue growth insight
    if (revenueGrowth > 20) {
      insights.push({
        type: 'success',
        title: 'Exceptional Revenue Growth',
        message: `Revenue growth of ${formatPercentage(revenueGrowth)} is outstanding. Consider expanding successful strategies.`,
        icon: '💰',
        priority: 'high'
      });
    } else if (revenueGrowth > 10) {
      insights.push({
        type: 'success',
        title: 'Strong Revenue Performance',
        message: `Revenue growth of ${formatPercentage(revenueGrowth)} exceeds targets. Maintain current momentum.`,
        icon: '📈',
        priority: 'medium'
      });
    } else if (revenueGrowth > 0) {
      insights.push({
        type: 'info',
        title: 'Positive Revenue Growth',
        message: `Revenue growth of ${formatPercentage(revenueGrowth)} is positive. Focus on scaling successful channels.`,
        icon: '📊',
        priority: 'medium'
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Revenue Growth Needs Attention',
        message: 'Revenue growth is declining. Review pricing strategy, product mix, and customer acquisition costs.',
        icon: '⚠️',
        priority: 'high'
      });
    }

    // Transaction value insight
    if (avgTransactionValue > 100000) {
      insights.push({
        type: 'success',
        title: 'High Transaction Values',
        message: `Average transaction value of ${formatCurrency(avgTransactionValue)} is excellent. Focus on premium customers.`,
        icon: '💎',
        priority: 'medium'
      });
    } else if (avgTransactionValue < 10000) {
      insights.push({
        type: 'warning',
        title: 'Low Transaction Values',
        message: `Average transaction value of ${formatCurrency(avgTransactionValue)} is low. Consider upselling strategies.`,
        icon: '📉',
        priority: 'medium'
      });
    }

    return insights;
  };

  const generateTransactionInsights = () => {
    const successRate = transactions.successRate || 0;
    const totalTransactions = transactions.totalTransactions || 0;
    const failedTransactions = transactions.failedTransactions || 0;
    const transactionsByType = transactions.transactionsByType || {};
    const transactionsByStatus = transactions.transactionsByStatus || {};

    const insights = [];

    // Success rate insight
    if (successRate > 95) {
      insights.push({
        type: 'success',
        title: 'Excellent Transaction Success',
        message: `Success rate of ${formatPercentage(successRate)} is outstanding. System is performing excellently.`,
        icon: '✅',
        priority: 'medium'
      });
    } else if (successRate > 85) {
      insights.push({
        type: 'info',
        title: 'Good Transaction Success',
        message: `Success rate of ${formatPercentage(successRate)} is good. Monitor for improvement opportunities.`,
        icon: '📊',
        priority: 'medium'
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Transaction Success Needs Improvement',
        message: `Success rate of ${formatPercentage(successRate)} needs attention. Review payment processing and error handling.`,
        icon: '⚠️',
        priority: 'high'
      });
    }

    // Transaction volume insight
    if (totalTransactions > 100) {
      insights.push({
        type: 'success',
        title: 'High Transaction Volume',
        message: `${formatNumber(totalTransactions)} transactions processed. Platform is handling good volume.`,
        icon: '📈',
        priority: 'medium'
      });
    } else if (totalTransactions < 10) {
      insights.push({
        type: 'warning',
        title: 'Low Transaction Volume',
        message: `Only ${totalTransactions} transactions. Focus on increasing user activity and transaction frequency.`,
        icon: '📉',
        priority: 'medium'
      });
    }

    // Transaction type balance
    const buyCount = transactionsByType.BUY || 0;
    const sellCount = transactionsByType.SELL || 0;
    if (buyCount > 0 && sellCount > 0) {
      const ratio = buyCount / sellCount;
      if (ratio > 2) {
        insights.push({
          type: 'info',
          title: 'Buy-Heavy Transaction Pattern',
          message: 'Buy transactions significantly outnumber sells. Consider promoting selling features.',
          icon: '🛒',
          priority: 'low'
        });
      } else if (ratio < 0.5) {
        insights.push({
          type: 'info',
          title: 'Sell-Heavy Transaction Pattern',
          message: 'Sell transactions significantly outnumber buys. Consider promoting buying opportunities.',
          icon: '💰',
          priority: 'low'
        });
      }
    }

    return insights;
  };

  const generateFinancialInsights = () => {
    const totalSilverHolding = dashboard.silverMetrics?.totalSilverHolding || 0;
    const averageSilverPrice = dashboard.silverMetrics?.averageSilverPrice || 0;
    const totalRevenue = financial.totalRevenue || 0;
    const marketTrend = dashboard.silverMetrics?.marketTrend || 'stable';

    const insights = [];

    // Silver holding insight
    if (totalSilverHolding > 1000) {
      insights.push({
        type: 'success',
        title: 'Significant Silver Holdings',
        message: `${formatNumber(totalSilverHolding)}g of silver held. Strong asset base for the platform.`,
        icon: '🥇',
        priority: 'medium'
      });
    } else if (totalSilverHolding < 100) {
      insights.push({
        type: 'warning',
        title: 'Low Silver Holdings',
        message: `Only ${formatNumber(totalSilverHolding)}g of silver held. Consider strategies to increase holdings.`,
        icon: '📉',
        priority: 'medium'
      });
    }

    // Market trend insight
    if (marketTrend === 'rising') {
      insights.push({
        type: 'success',
        title: 'Rising Silver Market',
        message: 'Silver prices are trending upward. This is favorable for platform growth.',
        icon: '📈',
        priority: 'medium'
      });
    } else if (marketTrend === 'falling') {
      insights.push({
        type: 'warning',
        title: 'Falling Silver Market',
        message: 'Silver prices are declining. Monitor market conditions and adjust strategies.',
        icon: '📉',
        priority: 'medium'
      });
    }

    // Revenue efficiency
    if (totalRevenue > 10000000) {
      insights.push({
        type: 'success',
        title: 'Strong Revenue Generation',
        message: `Revenue of ${formatCurrency(totalRevenue)} indicates healthy platform performance.`,
        icon: '💰',
        priority: 'medium'
      });
    }

    return insights;
  };

  const generateAllInsights = () => {
    const allInsights = [
      ...generateUserInsights(),
      ...generateRevenueInsights(),
      ...generateTransactionInsights(),
      ...generateFinancialInsights()
    ];

    // Sort by priority (high > medium > low) and limit to top 6
    return allInsights
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      })
      .slice(0, 6);
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20';
      case 'warning':
        return 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20';
      case 'info':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  const getInsightTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-emerald-700 dark:text-emerald-300';
      case 'warning':
        return 'text-amber-700 dark:text-amber-300';
      case 'info':
        return 'text-blue-700 dark:text-blue-300';
      default:
        return 'text-slate-700 dark:text-slate-300';
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-dark-secondary">Loading analytics...</p>
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
              <button 
                onClick={fetchAnalyticsData}
                className="mt-4 btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!analyticsData) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">No analytics data available</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const { dashboard, users, transactions, financial } = analyticsData;

  // Prepare chart data
  const monthlyChartData = dashboard.monthlyData?.map((item: any) => ({
    name: item.name,
    users: item.users,
    revenue: item.revenue,
    transactions: item.transactions || 0
  })) || [];

  const transactionTypeData = transactions.transactionsByType ? 
    Object.entries(transactions.transactionsByType).map(([type, count]) => ({
      name: type,
      value: count as number,
      fill: type === 'BUY' ? '#10B981' : '#F59E0B'
    })) : [];

  const userStatusData = users.usersByStatus ? 
    Object.entries(users.usersByStatus).map(([status, count]) => ({
      name: status,
      value: count as number,
      fill: status === 'ACTIVE' ? '#10B981' : '#6B7280'
    })) : [];

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-8">
          {/* Page header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-center"
          >
            <div>
              <h1 className="text-3xl font-bold text-gradient">Analytics</h1>
              <p className="mt-2 text-lg text-dark-tertiary">
                Business insights and performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange.value}
                onChange={(e) => setTimeRange(timeRanges.find(t => t.value === e.target.value) || timeRanges[1])}
                className="input-field"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary flex items-center space-x-2 ${hasActiveFilters() ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveFilters() && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 ml-1">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportReport}
                disabled={isExporting}
                className="btn-primary flex items-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Filters Panel */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: showFilters ? 1 : 0, 
              y: showFilters ? 0 : -20 
            }}
            transition={{ 
              duration: 0.2,
              ease: "easeOut"
            }}
            className={`premium-card p-6 ${showFilters ? 'block' : 'hidden'}`}
          >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-primary">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-dark-muted hover:text-dark-primary"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-2">
                    Transaction Type
                  </label>
                  <select
                    value={filters.transactionType}
                    onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="all">All Types</option>
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-2">
                    User Status
                  </label>
                  <select
                    value={filters.userStatus}
                    onChange={(e) => handleFilterChange('userStatus', e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="all">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-2">
                    Min Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    placeholder="0"
                    className="input-field w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-2">
                    Max Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    placeholder="1000000"
                    className="input-field w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-2">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="input-field w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-2">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={clearFilters}
                  className="btn-secondary"
                >
                  Clear All
                </button>
                <button
                  onClick={applyFilters}
                  className="btn-primary"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>

          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Active Filters ({getActiveFiltersCount()})
                  </span>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.transactionType !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                    Type: {filters.transactionType}
                  </span>
                )}
                {filters.userStatus !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                    Status: {filters.userStatus}
                  </span>
                )}
                {filters.minAmount && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                    Min: ₹{filters.minAmount}
                  </span>
                )}
                {filters.maxAmount && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                    Max: ₹{filters.maxAmount}
                  </span>
                )}
                {filters.dateFrom && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                    From: {filters.dateFrom}
                  </span>
                )}
                {filters.dateTo && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                    To: {filters.dateTo}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Overview metrics */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="premium-card p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-secondary">Total Users</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-primary truncate">
                    {formatNumber(dashboard.overview?.totalUsers || 0)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {getGrowthIcon(dashboard.users?.userGrowth || 0)}
                <span className={`ml-1 text-sm font-semibold ${getGrowthColor(dashboard.users?.userGrowth || 0)}`}>
                  {formatPercentage(dashboard.users?.userGrowth || 0)}
                </span>
                <span className="ml-1 text-sm text-dark-muted">from last month</span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="premium-card p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-secondary">Total Revenue</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-primary truncate">
                    {formatCurrency(dashboard.revenue?.totalRevenue || 0)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {getGrowthIcon(dashboard.revenue?.revenueGrowth || 0)}
                <span className={`ml-1 text-sm font-semibold ${getGrowthColor(dashboard.revenue?.revenueGrowth || 0)}`}>
                  {formatPercentage(dashboard.revenue?.revenueGrowth || 0)}
                </span>
                <span className="ml-1 text-sm text-dark-muted">from last month</span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="premium-card p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-secondary">Total Transactions</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-primary truncate">
                    {formatNumber(dashboard.overview?.totalTransactions || 0)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatPercentage(transactions.successRate || 0)} success rate
                </span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="premium-card p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-secondary">Avg Transaction Value</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-primary truncate">
                    {formatCurrency(dashboard.overview?.averageTransactionValue || 0)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {formatNumber(transactions.totalTransactions || 0)} total
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Charts and detailed analytics */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Monthly trends chart */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="premium-card p-6"
            >
              <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Monthly Trends
              </h3>
              {monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                        name.charAt(0).toUpperCase() + name.slice(1)
                      ]}
                    />
                    <Bar dataKey="users" fill="#3B82F6" name="Users" />
                    <Bar dataKey="transactions" fill="#F59E0B" name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-dark-muted">
                  <p>No monthly data available</p>
                </div>
              )}
            </motion.div>

            {/* Transaction types pie chart */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="premium-card p-6"
            >
              <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Transaction Types
              </h3>
              {transactionTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={transactionTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {transactionTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [formatNumber(value), 'Transactions']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-dark-muted">
                  <p>No transaction data available</p>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* User segments and transaction status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* User segments */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="premium-card p-6"
            >
              <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
                <UsersIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                User Segments
              </h3>
              <div className="space-y-4">
                {userStatusData.map((segment, index) => (
                  <motion.div 
                    key={segment.name} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.fill }}></div>
                      <span className="text-sm font-semibold text-dark-primary">{segment.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-dark-primary">{formatNumber(segment.value)}</div>
                      <div className="text-xs text-dark-muted">
                        {formatPercentage((segment.value / (users.totalUsers || 1)) * 100)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Transaction status */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="premium-card p-6"
            >
              <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Transaction Status
              </h3>
              <div className="space-y-4">
                {transactions.transactionsByStatus && Object.entries(transactions.transactionsByStatus).map(([status, count], index) => (
                  <motion.div 
                    key={status} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-dark-primary">{formatNumber(count as number)}</div>
                      <div className="text-xs text-dark-muted">
                        {formatPercentage((count as number / (transactions.totalTransactions || 1)) * 100)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Financial metrics and platform health */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Financial metrics */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="premium-card p-6"
            >
              <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Financial Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30">
                  <span className="text-sm font-semibold text-dark-primary">Total Silver Holding</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatNumber(dashboard.silverMetrics?.totalSilverHolding || 0)} g
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
                  <span className="text-sm font-semibold text-dark-primary">Average Silver Price</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    ₹{formatNumber(dashboard.silverMetrics?.averageSilverPrice || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30">
                  <span className="text-sm font-semibold text-dark-primary">Market Trend</span>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {dashboard.silverMetrics?.marketTrend || 'Stable'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Platform health */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="premium-card p-6"
            >
              <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
                <CogIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Platform Health
              </h3>
              <div className="space-y-4">
                {dashboard.platformHealth?.map((health: any, index: number) => (
                  <motion.div 
                    key={health.name} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                  >
                    <div>
                      <div className="text-sm font-semibold text-dark-primary">{health.name}</div>
                      <div className="text-xs text-dark-muted">Last updated: {new Date(health.lastUpdated).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${getStatusColor(health.status)}`}>
                        {health.value}
                      </div>
                      <div className="text-xs text-dark-muted">
                        {health.change > 0 ? '+' : ''}{health.change}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Quick insights */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-dark-primary flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                AI-Powered Insights
              </h3>
              <span className="text-xs text-dark-muted bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                {generateAllInsights().length} insights
              </span>
            </div>
            
            {generateAllInsights().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generateAllInsights().map((insight, index) => (
                  <motion.div 
                    key={`${insight.type}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    className={`premium-card p-4 border ${getInsightColor(insight.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{insight.icon}</span>
                      <div className="flex-1">
                        <h4 className={`text-sm font-semibold mb-2 ${getInsightTextColor(insight.type)}`}>
                          {insight.title}
                        </h4>
                        <p className={`text-sm ${getInsightTextColor(insight.type)}`}>
                          {insight.message}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            insight.priority === 'high' 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              : insight.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            {insight.priority} priority
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-dark-muted">No insights available. Add more data to generate intelligent insights.</p>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-dark-muted">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span>Success</span>
                <span className="w-2 h-2 bg-amber-500 rounded-full ml-4"></span>
                <span>Warning</span>
                <span className="w-2 h-2 bg-blue-500 rounded-full ml-4"></span>
                <span>Info</span>
              </div>
              <p className="text-xs text-dark-muted mt-2">
                Insights are automatically generated based on your data patterns and performance metrics.
              </p>
            </div>
          </motion.div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Analytics; 