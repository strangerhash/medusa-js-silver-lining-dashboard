import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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
  const [portfolios, setPortfolios] = useState(mockPortfolios);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredPortfolios = portfolios.filter(portfolio => {
    const matchesSearch = portfolio.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || portfolio.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPortfolioValue = portfolios.reduce((sum, p) => sum + p.currentValue, 0);
  const totalSilverHolding = portfolios.reduce((sum, p) => sum + p.silverHolding, 0);
  const totalProfitLoss = portfolios.reduce((sum, p) => sum + p.profitLoss, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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
              <div className="ml-4">
                <p className="text-sm font-semibold text-dark-secondary">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-dark-primary">
                  {formatCurrency(totalPortfolioValue)}
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
              <div className="ml-4">
                <p className="text-sm font-semibold text-dark-secondary">Total Silver Holding</p>
                <p className="text-2xl font-bold text-dark-primary">
                  {totalSilverHolding}g
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
              <div className="ml-4">
                <p className="text-sm font-semibold text-dark-secondary">Total P&L</p>
                <p className={`text-2xl font-bold ${getProfitLossColor(totalProfitLoss)}`}>
                  {formatCurrency(totalProfitLoss)}
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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
                {filteredPortfolios.map((portfolio, index) => (
                  <motion.tr 
                    key={portfolio.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-dark-primary">{portfolio.userName}</div>
                      <div className="text-xs text-dark-muted">ID: {portfolio.userId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-primary">
                      {formatCurrency(portfolio.totalInvested)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-primary">
                      {formatCurrency(portfolio.currentValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-primary">
                      {portfolio.silverHolding}g
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getProfitLossIcon(portfolio.profitLoss)}
                        <span className={`text-sm font-semibold ${getProfitLossColor(portfolio.profitLoss)}`}>
                          {formatCurrency(portfolio.profitLoss)}
                        </span>
                        <span className={`text-xs ${getProfitLossColor(portfolio.profitLoss)}`}>
                          ({portfolio.profitLossPercentage}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        portfolio.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                      }`}>
                        {portfolio.status}
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
                    Portfolio Details - {selectedPortfolio.userName}
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
                    <p className="text-xl font-bold text-dark-primary">{formatCurrency(selectedPortfolio.totalInvested)}</p>
                  </div>
                  <div className="premium-card p-4">
                    <h4 className="text-sm font-semibold text-dark-secondary mb-2">Current Value</h4>
                    <p className="text-xl font-bold text-dark-primary">{formatCurrency(selectedPortfolio.currentValue)}</p>
                  </div>
                  <div className="premium-card p-4">
                    <h4 className="text-sm font-semibold text-dark-secondary mb-2">Silver Holding</h4>
                    <p className="text-xl font-bold text-dark-primary">{selectedPortfolio.silverHolding}g</p>
                  </div>
                  <div className="premium-card p-4">
                    <h4 className="text-sm font-semibold text-dark-secondary mb-2">Profit/Loss</h4>
                    <div className="flex items-center space-x-2">
                      {getProfitLossIcon(selectedPortfolio.profitLoss)}
                      <p className={`text-xl font-bold ${getProfitLossColor(selectedPortfolio.profitLoss)}`}>
                        {formatCurrency(selectedPortfolio.profitLoss)}
                      </p>
                    </div>
                    <p className={`text-sm ${getProfitLossColor(selectedPortfolio.profitLoss)}`}>
                      ({selectedPortfolio.profitLossPercentage}%)
                    </p>
                  </div>
                </div>

                <div className="premium-card p-4">
                  <h4 className="text-sm font-semibold text-dark-secondary mb-2">Last Transaction</h4>
                  <p className="text-dark-primary">{selectedPortfolio.lastTransaction}</p>
                </div>

                <div className="premium-card p-4">
                  <h4 className="text-sm font-semibold text-dark-secondary mb-2">Status</h4>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    selectedPortfolio.status === 'Active' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                  }`}>
                    {selectedPortfolio.status}
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