import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    type: 'success',
    title: 'KYC Approved',
    message: 'KYC application for Priya Sharma has been approved successfully.',
    timestamp: '2024-01-20 14:30:00',
    read: false,
    category: 'kyc'
  },
  {
    id: 2,
    type: 'warning',
    title: 'High Transaction Volume',
    message: 'Unusual transaction volume detected. Please review recent activities.',
    timestamp: '2024-01-20 13:45:00',
    read: false,
    category: 'security'
  },
  {
    id: 3,
    type: 'info',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM IST.',
    timestamp: '2024-01-20 12:00:00',
    read: true,
    category: 'system'
  },
  {
    id: 4,
    type: 'error',
    title: 'Payment Failed',
    message: 'Payment transaction TXN003 failed due to insufficient funds.',
    timestamp: '2024-01-20 11:30:00',
    read: false,
    category: 'payment'
  },
  {
    id: 5,
    type: 'success',
    title: 'New User Registration',
    message: 'New user Vikram Mehta has completed registration.',
    timestamp: '2024-01-20 10:15:00',
    read: true,
    category: 'user'
  },
  {
    id: 6,
    type: 'info',
    title: 'Price Alert',
    message: 'Silver price has increased by 2.5% in the last 24 hours.',
    timestamp: '2024-01-20 09:00:00',
    read: false,
    category: 'market'
  }
];

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState('all');
  const [showRead, setShowRead] = useState(true);

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.category === filter;
    const matchesReadStatus = showRead || !notification.read;
    return matchesFilter && matchesReadStatus;
  });

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-emerald-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />;
      case 'error':
        return <XMarkIcon className="h-6 w-6 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-slate-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      case 'warning':
        return 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/20';
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'info':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-l-slate-500 bg-slate-50 dark:bg-slate-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
            <h1 className="text-3xl font-bold text-gradient">Notifications</h1>
            <p className="mt-2 text-lg text-dark-tertiary">
              Manage system notifications and alerts
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-dark-secondary">
              <span className="font-semibold text-dark-primary">{unreadCount}</span> unread
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={markAllAsRead}
              className="btn-secondary"
            >
              Mark all as read
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="premium-card p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              <option value="kyc">KYC</option>
              <option value="security">Security</option>
              <option value="system">System</option>
              <option value="payment">Payment</option>
              <option value="user">User</option>
              <option value="market">Market</option>
            </select>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showRead"
                checked={showRead}
                onChange={(e) => setShowRead(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
              />
              <label htmlFor="showRead" className="ml-2 text-sm text-dark-secondary">
                Show read notifications
              </label>
            </div>
          </div>
        </motion.div>

        {/* Notifications list */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-4"
        >
          {filteredNotifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="premium-card p-12 text-center"
            >
              <BellIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-dark-primary mb-2">No notifications</h3>
              <p className="text-dark-tertiary">You're all caught up!</p>
            </motion.div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                className={`premium-card p-6 border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? 'ring-2 ring-blue-500/20' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-lg font-semibold ${notification.read ? 'text-dark-secondary' : 'text-dark-primary'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            New
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 text-sm ${notification.read ? 'text-dark-tertiary' : 'text-dark-secondary'}`}>
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center space-x-4">
                        <span className="text-xs text-dark-muted flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        <span className="text-xs text-dark-muted capitalize">
                          {notification.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Notifications; 