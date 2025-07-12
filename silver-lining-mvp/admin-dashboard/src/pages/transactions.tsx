import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout/Layout';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { apiService } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

interface Transaction {
  id: string;
  userId: string;
  type: 'BUY' | 'SELL' | 'SIP';
  amount: number;
  silverQuantity: number;
  silverPrice: number;
  paymentMethod: string;
  referenceId: string;
  fees: number;
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'PROCESSING';
  remarks?: string;
  details?: any;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  totalSilverQuantity: number;
  transactionsByType: Record<string, any>;
  transactionsByStatus: Record<string, any>;
  monthlyStats: Record<string, any>;
  recentTransactions: Transaction[];
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
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

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await apiService.getTransactions({
        page: currentPage,
        limit,
        sortBy,
        sortOrder,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearchTerm || undefined
      });
      
      setTransactions(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.pagination.totalPages);
      setTotalTransactions(response.pagination.total);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showToast('Failed to load transactions', 'error');
      
      // Set fallback data to prevent UI from breaking
      setTransactions([]);
      setTotalPages(1);
      setTotalTransactions(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, sortBy, sortOrder, typeFilter, statusFilter, debouncedSearchTerm, showToast]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await apiService.getTransactionStats();
      
      // Set stats with the response data
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Failed to load transaction statistics', 'error');
      
      // Set fallback stats to prevent UI from breaking
      setStats({
        totalTransactions: 0,
        totalAmount: 0,
        totalSilverQuantity: 0,
        transactionsByType: {},
        transactionsByStatus: {},
        monthlyStats: {},
        recentTransactions: []
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
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter, debouncedSearchTerm]);

  // Safety check for deleted transactions in modal
  useEffect(() => {
    if (showModal && selectedTransaction) {
      const transactionExists = transactions.find(t => t.id === selectedTransaction.id);
      if (!transactionExists) {
        setShowModal(false);
        setSelectedTransaction(null);
        showToast('Transaction no longer exists', 'error');
      }
    }
  }, [showModal, selectedTransaction, transactions, showToast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'FAILED': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'PROCESSING': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BUY': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'SELL': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'SIP': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckIcon className="h-4 w-4 text-emerald-500" />;
      case 'FAILED': return <XMarkIcon className="h-4 w-4 text-red-500" />;
      case 'PENDING': return <ClockIcon className="h-4 w-4 text-amber-500" />;
      case 'PROCESSING': return <ArrowUpIcon className="h-4 w-4 text-blue-500" />;
      default: return <ClockIcon className="h-4 w-4 text-slate-500" />;
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  const handleViewTransaction = (transaction: Transaction) => {
    // Check if transaction still exists in the current list
    const transactionExists = transactions.find(t => t.id === transaction.id);
    if (!transactionExists) {
      showToast('Transaction not found or has been deleted', 'error');
      return;
    }
    
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  // Optional: Add function to fetch fresh transaction data
  const handleViewTransactionWithRefresh = async (transaction: Transaction) => {
    try {
      // Fetch fresh data from API
      const freshTransaction = await apiService.getTransaction(transaction.id);
      setSelectedTransaction(freshTransaction);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      showToast('Failed to load transaction details', 'error');
      // Fallback to using existing data
      setSelectedTransaction(transaction);
      setShowModal(true);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteModal(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      await apiService.deleteTransaction(deletingTransaction.id);
      showToast('Transaction deleted successfully', 'success');
      fetchTransactions();
      fetchStats();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('Failed to delete transaction', 'error');
    } finally {
      setShowDeleteModal(false);
      setDeletingTransaction(null);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedTransactions.length === 0) return;

    try {
      await apiService.bulkUpdateTransactions(selectedTransactions, bulkAction);
      showToast(`Successfully ${bulkAction.toLowerCase()} ${selectedTransactions.length} transactions`, 'success');
      setSelectedTransactions([]);
      fetchTransactions();
      fetchStats();
    } catch (error) {
      console.error('Error updating transactions:', error);
      showToast('Failed to update transactions', 'error');
    } finally {
      setShowBulkModal(false);
      setBulkAction('');
    }
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t.id));
    }
  };

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
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
      <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
      <ArrowDownIcon className="h-4 w-4 ml-1" />;
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
            <h1 className="text-3xl font-bold text-gradient">Transactions</h1>
            <p className="mt-2 text-lg text-dark-tertiary">
              View and manage all platform transactions
            </p>
            {backendConnected === false && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ Backend server is not accessible. Some features may not work properly.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-dark-secondary">
              <span className="font-semibold text-dark-primary">{totalTransactions}</span> total transactions
            </div>
          </div>
        </motion.div>

        {/* Summary cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="premium-card p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-secondary">Total Volume</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-primary truncate">
                  {statsLoading ? '...' : formatCurrencyCompact(stats?.totalAmount || 0)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="premium-card p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <ArrowUpIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-secondary">Buy Transactions</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-primary truncate">
                  {statsLoading ? '...' : stats?.transactionsByType?.BUY?.count || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="premium-card p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/25">
                <ArrowDownIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-secondary">Sell Transactions</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-primary truncate">
                  {statsLoading ? '...' : stats?.transactionsByType?.SELL?.count || 0}
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
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-secondary">Pending</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-primary truncate">
                  {statsLoading ? '...' : stats?.transactionsByStatus?.PENDING?.count || 0}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters and Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="premium-card p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by user, ID, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
              <option value="SIP">SIP</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
            </select>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedTransactions.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {selectedTransactions.length} transaction(s) selected
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Action</option>
                  <option value="COMPLETED">Mark as Completed</option>
                  <option value="FAILED">Mark as Failed</option>
                  <option value="PENDING">Mark as Pending</option>
                  <option value="PROCESSING">Mark as Processing</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  disabled={!bulkAction}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransactions([])}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear Selection
              </button>
            </div>
          )}
        </motion.div>

        {/* Transactions table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="premium-card overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-dark-secondary">Loading transactions...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider cursor-pointer hover:text-dark-primary"
                        onClick={() => handleSort('referenceId')}
                      >
                        <div className="flex items-center">
                          Transaction
                          <SortIcon field="referenceId" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider cursor-pointer hover:text-dark-primary"
                        onClick={() => handleSort('user')}
                      >
                        <div className="flex items-center">
                          User
                          <SortIcon field="user" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider cursor-pointer hover:text-dark-primary"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center">
                          Type
                          <SortIcon field="type" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider cursor-pointer hover:text-dark-primary"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center">
                          Amount
                          <SortIcon field="amount" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider cursor-pointer hover:text-dark-primary"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          <SortIcon field="status" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider cursor-pointer hover:text-dark-primary"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Date
                          <SortIcon field="createdAt" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-slate-200 dark:divide-slate-700">
                    {transactions.map((transaction, index) => (
                      <motion.tr 
                        key={transaction.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.includes(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-dark-primary">{transaction.id}</div>
                          <div className="text-xs text-dark-muted font-mono">{transaction.referenceId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-dark-primary">{transaction.user.name}</div>
                          <div className="text-xs text-dark-muted">{transaction.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-dark-primary">
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-xs text-dark-tertiary">
                            {transaction.silverQuantity}g @ ₹{transaction.silverPrice}/g
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                            {getStatusIcon(transaction.status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-tertiary">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleViewTransaction(transaction)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditTransaction(transaction)}
                              className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors duration-200"
                              title="Edit Transaction"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteTransaction(transaction)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                              title="Delete Transaction"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </motion.button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-dark-secondary">
                      Showing <span className="font-semibold text-dark-primary">{(currentPage - 1) * limit + 1}</span> to{' '}
                      <span className="font-semibold text-dark-primary">{Math.min(currentPage * limit, totalTransactions)}</span> of{' '}
                      <span className="font-semibold text-dark-primary">{totalTransactions}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </motion.button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Transaction Detail Modal */}
        {showModal && selectedTransaction && (
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
              className="premium-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gradient">
                    Transaction Details - {selectedTransaction.id}
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

              <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="premium-card p-6">
                    <h4 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Transaction Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Transaction ID:</span>
                        <span className="text-dark-primary font-mono">{selectedTransaction.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Reference:</span>
                        <span className="text-dark-primary font-mono">{selectedTransaction.referenceId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-dark-secondary">Type:</span>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedTransaction.type)}`}>
                          {selectedTransaction.type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-dark-secondary">Status:</span>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                          {selectedTransaction.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="premium-card p-6">
                    <h4 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                      <EyeIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      User Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Name:</span>
                        <span className="text-dark-primary">{selectedTransaction.user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Email:</span>
                        <span className="text-dark-primary">{selectedTransaction.user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Payment Method:</span>
                        <span className="text-dark-primary">{selectedTransaction.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="premium-card p-6">
                  <h4 className="text-lg font-semibold text-dark-primary mb-6 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Transaction Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="premium-card p-4 border border-slate-200 dark:border-slate-700">
                      <div className="text-sm font-semibold text-dark-secondary">Amount</div>
                      <div className="text-xl font-bold text-dark-primary">{formatCurrency(selectedTransaction.amount)}</div>
                    </div>
                    <div className="premium-card p-4 border border-slate-200 dark:border-slate-700">
                      <div className="text-sm font-semibold text-dark-secondary">Silver Quantity</div>
                      <div className="text-xl font-bold text-dark-primary">{selectedTransaction.silverQuantity}g</div>
                    </div>
                    <div className="premium-card p-4 border border-slate-200 dark:border-slate-700">
                      <div className="text-sm font-semibold text-dark-secondary">Price per Gram</div>
                      <div className="text-xl font-bold text-dark-primary">₹{selectedTransaction.silverPrice}</div>
                    </div>
                  </div>
                  {selectedTransaction.fees > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="premium-card p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-sm font-semibold text-dark-secondary">Fees</div>
                        <div className="text-xl font-bold text-dark-primary">{formatCurrency(selectedTransaction.fees)}</div>
                      </div>
                      <div className="premium-card p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-sm font-semibold text-dark-secondary">Total Amount</div>
                        <div className="text-xl font-bold text-dark-primary">{formatCurrency(selectedTransaction.totalAmount)}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="premium-card p-6">
                  <h4 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Timeline
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-semibold text-dark-secondary">Created:</span>
                      <span className="text-dark-primary">{formatDate(selectedTransaction.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-dark-secondary">Last Updated:</span>
                      <span className="text-dark-primary">{formatDate(selectedTransaction.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {selectedTransaction.remarks && (
                  <div className="premium-card p-6">
                    <h4 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                      <PencilIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Remarks
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl">
                      {selectedTransaction.remarks}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingTransaction && (
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
              className="premium-card max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                    <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-dark-primary">Delete Transaction</h3>
                    <p className="text-sm text-dark-secondary">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-sm text-dark-tertiary mb-6">
                  Are you sure you want to delete transaction <span className="font-semibold">{deletingTransaction.referenceId}</span>?
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteTransaction}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Bulk Action Confirmation Modal */}
        {showBulkModal && (
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
              className="premium-card max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <CheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-dark-primary">Bulk Update</h3>
                    <p className="text-sm text-dark-secondary">Update multiple transactions</p>
                  </div>
                </div>
                <p className="text-sm text-dark-tertiary mb-6">
                  Are you sure you want to mark <span className="font-semibold">{selectedTransactions.length}</span> transaction(s) as <span className="font-semibold">{bulkAction.toLowerCase()}</span>?
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkAction}
                    className="btn-primary"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Transactions; 