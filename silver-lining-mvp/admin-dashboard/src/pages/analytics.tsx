import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalUsers: 12847,
    totalRevenue: 45200000,
    totalTransactions: 15420,
    avgTransactionValue: 2931,
    userGrowth: 12.5,
    revenueGrowth: 23.1,
    transactionGrowth: 8.2,
    avgTransactionGrowth: -2.1
  },
  monthlyData: [
    { month: 'Jan', users: 8500, revenue: 28000000, transactions: 9800 },
    { month: 'Feb', users: 9200, revenue: 32000000, transactions: 10500 },
    { month: 'Mar', users: 9800, revenue: 35000000, transactions: 11200 },
    { month: 'Apr', users: 10400, revenue: 38000000, transactions: 11800 },
    { month: 'May', users: 11200, revenue: 41000000, transactions: 12500 },
    { month: 'Jun', users: 12000, revenue: 44000000, transactions: 13200 },
    { month: 'Jul', users: 12847, revenue: 45200000, transactions: 15420 }
  ],
  userSegments: [
    { segment: 'New Users', count: 3247, percentage: 25.3 },
    { segment: 'Active Users', count: 6847, percentage: 53.3 },
    { segment: 'Premium Users', count: 2753, percentage: 21.4 }
  ],
  topProducts: [
    { name: 'Silver Coins (10g)', sales: 1250, revenue: 1250000 },
    { name: 'Silver Bars (100g)', sales: 890, revenue: 8900000 },
    { name: 'Silver ETFs', sales: 2340, revenue: 4680000 },
    { name: 'SIP Plans', sales: 5670, revenue: 11340000 }
  ],
  recentActivity: [
    { type: 'New User Registration', count: 45, change: '+12%' },
    { type: 'KYC Completed', count: 38, change: '+8%' },
    { type: 'First Transaction', count: 32, change: '+15%' },
    { type: 'SIP Started', count: 28, change: '+22%' }
  ]
};

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('users');

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

  return (
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
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-field"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary flex items-center space-x-2"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Export Report</span>
            </motion.button>
          </div>
        </motion.div>

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
              <div>
                <p className="text-sm font-semibold text-dark-secondary">Total Users</p>
                <p className="text-2xl font-bold text-dark-primary">
                  {formatNumber(mockAnalytics.overview.totalUsers)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {getGrowthIcon(mockAnalytics.overview.userGrowth)}
              <span className={`ml-1 text-sm font-semibold ${getGrowthColor(mockAnalytics.overview.userGrowth)}`}>
                {mockAnalytics.overview.userGrowth}%
              </span>
              <span className="ml-1 text-sm text-dark-muted">from last month</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-dark-secondary">Total Revenue</p>
                <p className="text-2xl font-bold text-dark-primary">
                  {formatCurrency(mockAnalytics.overview.totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {getGrowthIcon(mockAnalytics.overview.revenueGrowth)}
              <span className={`ml-1 text-sm font-semibold ${getGrowthColor(mockAnalytics.overview.revenueGrowth)}`}>
                {mockAnalytics.overview.revenueGrowth}%
              </span>
              <span className="ml-1 text-sm text-dark-muted">from last month</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-dark-secondary">Total Transactions</p>
                <p className="text-2xl font-bold text-dark-primary">
                  {formatNumber(mockAnalytics.overview.totalTransactions)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {getGrowthIcon(mockAnalytics.overview.transactionGrowth)}
              <span className={`ml-1 text-sm font-semibold ${getGrowthColor(mockAnalytics.overview.transactionGrowth)}`}>
                {mockAnalytics.overview.transactionGrowth}%
              </span>
              <span className="ml-1 text-sm text-dark-muted">from last month</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-dark-secondary">Avg Transaction Value</p>
                <p className="text-2xl font-bold text-dark-primary">
                  ₹{mockAnalytics.overview.avgTransactionValue}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25">
                <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {getGrowthIcon(mockAnalytics.overview.avgTransactionGrowth)}
              <span className={`ml-1 text-sm font-semibold ${getGrowthColor(mockAnalytics.overview.avgTransactionGrowth)}`}>
                {mockAnalytics.overview.avgTransactionGrowth}%
              </span>
              <span className="ml-1 text-sm text-dark-muted">from last month</span>
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
          {/* Monthly trends */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="premium-card p-6"
          >
            <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Monthly Trends
            </h3>
            <div className="space-y-4">
              {mockAnalytics.monthlyData.map((data, index) => (
                <motion.div 
                  key={data.month} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                >
                  <span className="text-sm font-semibold text-dark-primary">{data.month}</span>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-dark-primary">{formatNumber(data.users)}</div>
                      <div className="text-xs text-dark-muted">Users</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-dark-primary">{formatCurrency(data.revenue)}</div>
                      <div className="text-xs text-dark-muted">Revenue</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-dark-primary">{formatNumber(data.transactions)}</div>
                      <div className="text-xs text-dark-muted">Transactions</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

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
              {mockAnalytics.userSegments.map((segment, index) => (
                <motion.div 
                  key={segment.segment} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <span className="text-sm font-semibold text-dark-primary">{segment.segment}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-dark-primary">{formatNumber(segment.count)}</div>
                    <div className="text-xs text-dark-muted">{segment.percentage}%</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Top products and recent activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Top products */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="premium-card p-6"
          >
            <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Top Products
            </h3>
            <div className="space-y-4">
              {mockAnalytics.topProducts.map((product, index) => (
                <motion.div 
                  key={product.name} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                >
                  <div>
                    <div className="text-sm font-semibold text-dark-primary">{product.name}</div>
                    <div className="text-xs text-dark-muted">{formatNumber(product.sales)} sales</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-dark-primary">{formatCurrency(product.revenue)}</div>
                    <div className="text-xs text-dark-muted">Revenue</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent activity */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="premium-card p-6"
          >
            <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {mockAnalytics.recentActivity.map((activity, index) => (
                <motion.div 
                  key={activity.type} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                >
                  <div>
                    <div className="text-sm font-semibold text-dark-primary">{activity.type}</div>
                    <div className="text-xs text-dark-muted">{activity.count} today</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${activity.change.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {activity.change}
                    </div>
                    <div className="text-xs text-dark-muted">vs yesterday</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Performance metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30"
            >
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">98.5%</div>
              <div className="text-sm text-dark-secondary">Transaction Success Rate</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30"
            >
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">2.3s</div>
              <div className="text-sm text-dark-secondary">Average Response Time</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30"
            >
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">99.9%</div>
              <div className="text-sm text-dark-secondary">Platform Uptime</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick insights */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="premium-card p-6"
        >
          <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Quick Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="premium-card p-4 border border-blue-200 dark:border-blue-800"
            >
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Growth Opportunity</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                User registration increased by 12.5% this month. Consider targeted marketing campaigns to maintain momentum.
              </p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="premium-card p-4 border border-emerald-200 dark:border-emerald-800"
            >
              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Revenue Performance</h4>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Revenue growth of 23.1% exceeds targets. SIP plans are driving significant recurring revenue.
              </p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="premium-card p-4 border border-amber-200 dark:border-amber-800"
            >
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">Attention Required</h4>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Average transaction value decreased by 2.1%. Review pricing strategy and product mix.
              </p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="premium-card p-4 border border-purple-200 dark:border-purple-800"
            >
              <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">User Engagement</h4>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                53.3% of users are active monthly. Focus on retention strategies for inactive users.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Analytics; 