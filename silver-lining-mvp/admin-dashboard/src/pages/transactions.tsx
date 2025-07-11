import React, { useState } from 'react';
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
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Mock transaction data
const mockTransactions = [
  {
    id: 'TXN001',
    userId: 101,
    userName: 'Rahul Kumar',
    type: 'Buy',
    amount: 5000,
    silverQuantity: 50,
    pricePerGram: 100,
    status: 'Completed',
    paymentMethod: 'UPI',
    transactionDate: '2024-01-20 14:30:00',
    completedDate: '2024-01-20 14:32:00',
    reference: 'UPI123456789'
  },
  {
    id: 'TXN002',
    userId: 102,
    userName: 'Priya Sharma',
    type: 'Sell',
    amount: 3200,
    silverQuantity: 32,
    pricePerGram: 100,
    status: 'Pending',
    paymentMethod: 'Bank Transfer',
    transactionDate: '2024-01-20 15:45:00',
    completedDate: null,
    reference: 'BT987654321'
  },
  {
    id: 'TXN003',
    userId: 103,
    userName: 'Amit Patel',
    type: 'Buy',
    amount: 10000,
    silverQuantity: 100,
    pricePerGram: 100,
    status: 'Failed',
    paymentMethod: 'Credit Card',
    transactionDate: '2024-01-20 16:20:00',
    completedDate: null,
    reference: 'CC456789123',
    failureReason: 'Insufficient funds'
  },
  {
    id: 'TXN004',
    userId: 104,
    userName: 'Neha Singh',
    type: 'SIP',
    amount: 2000,
    silverQuantity: 20,
    pricePerGram: 100,
    status: 'Processing',
    paymentMethod: 'UPI AutoPay',
    transactionDate: '2024-01-20 17:00:00',
    completedDate: null,
    reference: 'SIP789123456'
  },
  {
    id: 'TXN005',
    userId: 105,
    userName: 'Vikram Mehta',
    type: 'Buy',
    amount: 7500,
    silverQuantity: 75,
    pricePerGram: 100,
    status: 'Completed',
    paymentMethod: 'Net Banking',
    transactionDate: '2024-01-20 18:15:00',
    completedDate: '2024-01-20 18:17:00',
    reference: 'NB321654987'
  }
];

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         txn.reference.includes(searchTerm);
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Failed': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Buy': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Sell': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'SIP': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckIcon className="h-4 w-4 text-emerald-500" />;
      case 'Failed': return <XMarkIcon className="h-4 w-4 text-red-500" />;
      case 'Pending': return <ClockIcon className="h-4 w-4 text-amber-500" />;
      case 'Processing': return <ArrowUpIcon className="h-4 w-4 text-blue-500" />;
      default: return <ClockIcon className="h-4 w-4 text-slate-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN');
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
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-dark-secondary">
              <span className="font-semibold text-dark-primary">{transactions.length}</span> total transactions
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
              <div className="ml-4">
                <p className="text-sm font-semibold text-dark-secondary">Total Volume</p>
                <p className="text-2xl font-bold text-dark-primary">
                  {formatCurrency(transactions.reduce((sum, txn) => sum + txn.amount, 0))}
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
              <div className="ml-4">
                <p className="text-sm font-semibold text-dark-secondary">Buy Transactions</p>
                <p className="text-2xl font-bold text-dark-primary">
                  {transactions.filter(txn => txn.type === 'Buy').length}
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
              <div className="ml-4">
                <p className="text-sm font-semibold text-dark-secondary">Sell Transactions</p>
                <p className="text-2xl font-bold text-dark-primary">
                  {transactions.filter(txn => txn.type === 'Sell').length}
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
              <div className="ml-4">
                <p className="text-sm font-semibold text-dark-secondary">Pending</p>
                <p className="text-2xl font-bold text-dark-primary">
                  {transactions.filter(txn => txn.status === 'Pending').length}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
              <option value="SIP">SIP</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
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
        </motion.div>

        {/* Transactions table */}
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
                    Transaction
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTransactions.map((transaction, index) => (
                  <motion.tr 
                    key={transaction.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-dark-primary">{transaction.id}</div>
                      <div className="text-xs text-dark-muted font-mono">{transaction.reference}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-dark-primary">{transaction.userName}</div>
                      <div className="text-xs text-dark-muted">ID: {transaction.userId}</div>
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
                        {transaction.silverQuantity}g @ ₹{transaction.pricePerGram}/g
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
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedTransaction(transaction);
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

          {/* Pagination */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary"
              >
                Previous
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary"
              >
                Next
              </motion.button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-dark-secondary">
                  Showing <span className="font-semibold text-dark-primary">1</span> to <span className="font-semibold text-dark-primary">{filteredTransactions.length}</span> of{' '}
                  <span className="font-semibold text-dark-primary">{transactions.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                  >
                    Previous
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                  >
                    Next
                  </motion.button>
                </nav>
              </div>
            </div>
          </div>
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
              className="premium-card max-w-2xl w-full"
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
                        <span className="text-dark-primary font-mono">{selectedTransaction.reference}</span>
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
                        <span className="text-dark-primary">{selectedTransaction.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">User ID:</span>
                        <span className="text-dark-primary">{selectedTransaction.userId}</span>
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
                      <div className="text-xl font-bold text-dark-primary">₹{selectedTransaction.pricePerGram}</div>
                    </div>
                  </div>
                </div>

                <div className="premium-card p-6">
                  <h4 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Timeline
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-semibold text-dark-secondary">Transaction Date:</span>
                      <span className="text-dark-primary">{formatDate(selectedTransaction.transactionDate)}</span>
                    </div>
                    {selectedTransaction.completedDate && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Completed Date:</span>
                        <span className="text-dark-primary">{formatDate(selectedTransaction.completedDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedTransaction.failureReason && (
                  <div className="premium-card p-6">
                    <h4 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                      <XMarkIcon className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
                      Failure Reason
                    </h4>
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
                      {selectedTransaction.failureReason}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Transactions; 