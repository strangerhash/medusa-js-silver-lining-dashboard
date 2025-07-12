import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout/Layout';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { apiService } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

interface Portfolio {
  id: string;
  userId: string;
  totalSilverHolding: number;
  totalInvested: number;
  currentValue: number;
  totalProfit: number;
  profitPercentage: number;
  averageBuyPrice: number;
  currentSilverPrice: number;
  holdings: any[];
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  lastUpdated: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
  };
}

interface PortfolioStats {
  totalPortfolios: number;
  totalSilverHolding: number;
  totalPortfolioValue: number;
  totalInvested: number;
  totalProfit: number;
  overallProfitPercentage: number;
  averageSilverPrice: number;
  averagePortfolioValue: number;
  topPerformers: Portfolio[];
  recentPortfolios: Portfolio[];
}

// Mock portfolio data
const mockPortfolios = [
  {
    id: 1,
    userId: 101,
    userName: 'Rahul Kumar',
    totalInvested: 25000,
    currentValue: 27500,
    silverHolding: 250,
    profitLoss: 2500,
    profitLossPercentage: 10,
    lastTransaction: '2024-01-20',
    status: 'Active'
  },
  {
    id: 2,
    userId: 102,
    userName: 'Priya Sharma',
    totalInvested: 15000,
    currentValue: 16200,
    silverHolding: 150,
    profitLoss: 1200,
    profitLossPercentage: 8,
    lastTransaction: '2024-01-19',
    status: 'Active'
  },
  {
    id: 3,
    userId: 103,
    userName: 'Amit Patel',
    totalInvested: 0,
    currentValue: 0,
    silverHolding: 0,
    profitLoss: 0,
    profitLossPercentage: 0,
    lastTransaction: '2024-01-15',
    status: 'Inactive'
  },
  {
    id: 4,
    userId: 104,
    userName: 'Neha Singh',
    totalInvested: 50000,
    currentValue: 55000,
    silverHolding: 500,
    profitLoss: 5000,
    profitLossPercentage: 10,
    lastTransaction: '2024-01-20',
    status: 'Active'
  },
  {
    id: 5,
    userId: 105,
    userName: 'Vikram Mehta',
    totalInvested: 10000,
    currentValue: 10800,
    silverHolding: 100,
    profitLoss: 800,
    profitLossPercentage: 8,
    lastTransaction: '2024-01-10',
    status: 'Active'
  }
];

const Portfolio: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPortfolio, setDeletingPortfolio] = useState<Portfolio | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPortfolios, setTotalPortfolios] = useState(0);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('currentValue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minValue, setMinValue] = useState<number | undefined>();
  const [maxValue, setMaxValue] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  const { showToast } = useToast();

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch portfolios
  const fetchPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        sortBy,
        sortOrder
      };

      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (minValue !== undefined) params.minValue = minValue;
      if (maxValue !== undefined) params.maxValue = maxValue;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await apiService.getPortfolios(params);
      
      setPortfolios(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalPortfolios(response.pagination.total);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      showToast('Failed to load portfolios', 'error');
      
      // Set fallback data to prevent UI from breaking
      setPortfolios([]);
      setTotalPages(1);
      setTotalPortfolios(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, sortBy, sortOrder, debouncedSearchTerm, minValue, maxValue, statusFilter, showToast]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await apiService.getPortfolioStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Failed to load portfolio statistics', 'error');
      
      // Set fallback stats to prevent UI from breaking
      setStats({
        totalPortfolios: 0,
        totalSilverHolding: 0,
        totalPortfolioValue: 0,
        totalInvested: 0,
        totalProfit: 0,
        overallProfitPercentage: 0,
        averageSilverPrice: 0,
        averagePortfolioValue: 0,
        topPerformers: [],
        recentPortfolios: []
      });
    } finally {
      setStatsLoading(false);
    }
  }, [showToast]);

  // Test backend connection
  useEffect(() => {
    const testBackend = async () => {
      try {
        const isConnected = await apiService.testConnection();
        setBackendConnected(isConnected);
        if (!isConnected) {
          showToast('Backend server is not accessible. Please check if the server is running.', 'warning');
        }
      } catch (error) {
        console.error('Backend connection test failed:', error);
        setBackendConnected(false);
        showToast('Backend server is not accessible. Please check if the server is running.', 'warning');
      }
    };
    
    testBackend();
  }, [showToast]);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, minValue, maxValue]);

  const handleViewPortfolio = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setShowModal(true);
  };

  const handleDeletePortfolio = (portfolio: Portfolio) => {
    setDeletingPortfolio(portfolio);
    setShowDeleteModal(true);
  };

  const confirmDeletePortfolio = async () => {
    if (!deletingPortfolio) return;

    try {
      await apiService.deletePortfolio(deletingPortfolio.id);
      showToast('Portfolio deleted successfully', 'success');
      fetchPortfolios();
      fetchStats();
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      showToast('Failed to delete portfolio', 'error');
    } finally {
      setShowDeleteModal(false);
      setDeletingPortfolio(null);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? 
      <ArrowTrendingUpIcon className="h-4 w-4 ml-1" /> : 
      <ArrowTrendingDownIcon className="h-4 w-4 ml-1" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatCurrencyCompact = (amount: number) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    let result = '';
    if (absAmount >= 10000000) { // 1 crore
      result = `₹${(absAmount / 10000000).toFixed(1)}Cr`;
    } else if (absAmount >= 100000) { // 1 lakh
      result = `₹${(absAmount / 100000).toFixed(1)}L`;
    } else if (absAmount >= 1000) { // 1 thousand
      result = `₹${(absAmount / 1000).toFixed(1)}K`;
    } else {
      return formatCurrency(amount);
    }
    
    return isNegative ? `-${result}` : result;
  };

  const getProfitLossColor = (value: number) => {
    return value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  };

  const getProfitLossIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
    ) : (
      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
    );
  };

  const formatPercentage = (value: number) => {
    // Handle NaN, Infinity, and very large numbers
    if (!isFinite(value)) {
      return '0.00%';
    }
    
    // Handle very small percentages (less than 0.01%)
    if (Math.abs(value) < 0.01 && value !== 0) {
      return value > 0 ? '<0.01%' : '>-0.01%';
    }
    
    return `${value.toFixed(2)}%`;
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
            <h1 className="text-3xl font-bold text-gradient">Portfolio Management</h1>
            <p className="mt-2 text-lg text-dark-tertiary">
              View and manage user portfolios and silver holdings
            </p>
            {backendConnected === false && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ Backend server is not accessible. Some features may not work properly.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Summary cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="premium-card p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-secondary">Total Portfolio Value</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-primary truncate">
                  {statsLoading ? '...' : formatCurrencyCompact(stats?.totalPortfolioValue || 0)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="premium-card p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                <ScaleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-secondary">Total Silver Holding</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-primary truncate">
                  {statsLoading ? '...' : `${stats?.totalSilverHolding || 0}g`}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="premium-card p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
                <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-secondary">Total P&L</p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold truncate ${getProfitLossColor(stats?.totalProfit || 0)}`}>
                  {statsLoading ? '...' : formatCurrencyCompact(stats?.totalProfit || 0)}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="premium-card p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search portfolios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
            </select>

            {/* Sort by */}
            <select className="input-field">
              <option>Sort by Value (High to Low)</option>
              <option>Sort by Value (Low to High)</option>
              <option>Sort by P&L (High to Low)</option>
              <option>Sort by P&L (Low to High)</option>
            </select>
          </div>
        </motion.div>

        {/* Portfolios table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="premium-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Total Invested
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Silver Holding
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-slate-200 dark:divide-slate-700">
                {portfolios.map((portfolio, index) => (
                  <motion.tr 
                    key={portfolio.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-dark-primary">{portfolio.user.name}</div>
                      <div className="text-xs text-dark-muted">ID: {portfolio.userId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-primary">
                      {formatCurrencyCompact(portfolio.totalInvested)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-primary">
                      {formatCurrencyCompact(portfolio.currentValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-primary">
                      {portfolio.totalSilverHolding}g
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getProfitLossIcon(portfolio.totalProfit)}
                        <span className={`text-sm font-semibold ${getProfitLossColor(portfolio.totalProfit)}`}>
                          {formatCurrencyCompact(portfolio.totalProfit)}
                        </span>
                        <span className={`text-xs ${getProfitLossColor(portfolio.totalProfit)}`}>
                          ({formatPercentage(portfolio.profitPercentage)})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        portfolio.user.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                      }`}>
                        {portfolio.user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedPortfolio(portfolio);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Portfolio Detail Modal */}
        {showModal && selectedPortfolio && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="premium-card max-w-2xl w-full"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gradient">
                    Portfolio Details - {selectedPortfolio.user.name}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="premium-card p-4">
                    <h4 className="text-sm font-semibold text-dark-secondary mb-2">Total Invested</h4>
                    <p className="text-xl font-bold text-dark-primary">{formatCurrencyCompact(selectedPortfolio.totalInvested)}</p>
                  </div>
                  <div className="premium-card p-4">
                    <h4 className="text-sm font-semibold text-dark-secondary mb-2">Current Value</h4>
                    <p className="text-xl font-bold text-dark-primary">{formatCurrencyCompact(selectedPortfolio.currentValue)}</p>
                  </div>
                  <div className="premium-card p-4">
                    <h4 className="text-sm font-semibold text-dark-secondary mb-2">Silver Holding</h4>
                    <p className="text-xl font-bold text-dark-primary">{selectedPortfolio.totalSilverHolding}g</p>
                  </div>
                  <div className="premium-card p-4">
                    <h4 className="text-sm font-semibold text-dark-secondary mb-2">Profit/Loss</h4>
                    <div className="flex items-center space-x-2">
                      {getProfitLossIcon(selectedPortfolio.totalProfit)}
                      <p className={`text-xl font-bold ${getProfitLossColor(selectedPortfolio.totalProfit)}`}>
                        {formatCurrencyCompact(selectedPortfolio.totalProfit)}
                      </p>
                    </div>
                    <p className={`text-sm ${getProfitLossColor(selectedPortfolio.totalProfit)}`}>
                      ({formatPercentage(selectedPortfolio.profitPercentage)})
                    </p>
                  </div>
                </div>

                <div className="premium-card p-4">
                  <h4 className="text-sm font-semibold text-dark-secondary mb-2">Last Transaction</h4>
                  <p className="text-dark-primary">{selectedPortfolio.lastUpdated}</p>
                </div>

                <div className="premium-card p-4">
                  <h4 className="text-sm font-semibold text-dark-secondary mb-2">Status</h4>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    selectedPortfolio.user.status === 'ACTIVE' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                  }`}>
                    {selectedPortfolio.user.status}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Portfolio; 