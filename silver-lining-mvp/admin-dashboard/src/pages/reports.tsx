import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Mock reports data
const mockReports = [
  {
    id: 1,
    name: 'Monthly User Report',
    type: 'User Analytics',
    status: 'Completed',
    generatedDate: '2024-01-20 10:30:00',
    size: '2.4 MB',
    format: 'PDF'
  },
  {
    id: 2,
    name: 'Transaction Summary Q4 2023',
    type: 'Financial',
    status: 'Completed',
    generatedDate: '2024-01-19 15:45:00',
    size: '1.8 MB',
    format: 'Excel'
  },
  {
    id: 3,
    name: 'KYC Compliance Report',
    type: 'Compliance',
    status: 'Processing',
    generatedDate: '2024-01-20 14:20:00',
    size: 'Processing...',
    format: 'PDF'
  },
  {
    id: 4,
    name: 'Portfolio Performance Analysis',
    type: 'Investment',
    status: 'Failed',
    generatedDate: '2024-01-18 09:15:00',
    size: 'Failed',
    format: 'Excel'
  },
  {
    id: 5,
    name: 'Daily Transaction Log',
    type: 'Operational',
    status: 'Completed',
    generatedDate: '2024-01-20 23:59:00',
    size: '3.2 MB',
    format: 'CSV'
  }
];

const reportTypes = [
  { id: 'user-analytics', name: 'User Analytics', icon: UsersIcon, description: 'User growth, engagement, and behavior analysis' },
  { id: 'financial', name: 'Financial Reports', icon: CurrencyDollarIcon, description: 'Revenue, transactions, and financial performance' },
  { id: 'compliance', name: 'Compliance Reports', icon: DocumentTextIcon, description: 'KYC, regulatory compliance, and audit reports' },
  { id: 'investment', name: 'Investment Analysis', icon: ChartBarIcon, description: 'Portfolio performance and investment insights' },
  { id: 'operational', name: 'Operational Reports', icon: ClockIcon, description: 'System performance, uptime, and operational metrics' }
];

const Reports: React.FC = () => {
  const [reports, setReports] = useState(mockReports);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Processing': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Failed': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckIcon className="h-4 w-4 text-emerald-500" />;
      case 'Processing': return <ClockIcon className="h-4 w-4 text-amber-500" />;
      case 'Failed': return <DocumentTextIcon className="h-4 w-4 text-red-500" />;
      default: return <ClockIcon className="h-4 w-4 text-slate-500" />;
    }
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
            <h1 className="text-3xl font-bold text-gradient">Reports</h1>
            <p className="mt-2 text-lg text-dark-tertiary">
              Generate and manage platform reports
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <DocumentTextIcon className="h-5 w-5" />
            <span>Generate Report</span>
          </motion.button>
        </motion.div>

        {/* Report types */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {reportTypes.map((type, index) => (
            <motion.div 
              key={type.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="premium-card p-6 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                  <type.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-primary">{type.name}</h3>
                  <p className="text-sm text-dark-tertiary">{type.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent reports */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="premium-card"
        >
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-dark-primary flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Recent Reports
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-slate-200 dark:divide-slate-700">
                {reports.map((report, index) => (
                  <motion.tr 
                    key={report.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-dark-primary">{report.name}</div>
                      <div className="text-sm text-dark-muted">{report.format} format</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-primary">
                      {report.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        {getStatusIcon(report.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-tertiary">
                      {formatDate(report.generatedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-tertiary">
                      {report.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {report.status === 'Completed' && (
                          <motion.button 
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </motion.button>
                        )}
                        <motion.button 
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors duration-200"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Generate Report Modal */}
        {showGenerateModal && (
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
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gradient">Generate Report</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowGenerateModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-dark-secondary mb-2">
                    Report Type
                  </label>
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select report type</option>
                    <option value="user-analytics">User Analytics</option>
                    <option value="financial">Financial Reports</option>
                    <option value="compliance">Compliance Reports</option>
                    <option value="investment">Investment Analysis</option>
                    <option value="operational">Operational Reports</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-secondary mb-2">
                    Date Range
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="input-field"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowGenerateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary flex-1"
                  >
                    Generate Report
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Reports; 