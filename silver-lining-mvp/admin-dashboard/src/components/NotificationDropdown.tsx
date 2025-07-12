import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, Mail, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../utils/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  notificationsByType: Record<string, number>;
  recentNotifications: Notification[];
}

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Load notifications
  const loadNotifications = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      console.log('Loading notifications for page:', pageNum);
      
      const response = await apiService.getNotifications({
        page: pageNum,
        limit: 10,
        unreadOnly: false
      });

      console.log('Notification response:', response);

      if (response.success && response.data) {
        const newNotifications = response.data.notifications || response.data;
        const pagination = response.data.pagination || response.pagination;

        console.log('New notifications:', newNotifications);
        console.log('Pagination:', pagination);

        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }

        setHasMore(pagination ? pagination.hasNext : newNotifications.length === 10);
        setPage(pageNum);
      } else {
        console.log('No notifications found or response not successful');
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load notification stats
  const loadStats = async () => {
    try {
      console.log('Loading notification stats...');
      const response = await apiService.getNotificationStats();
      console.log('Stats response:', response);
      
      if (response.success && response.data) {
        setStats(response.data);
        console.log('Stats set:', response.data);
      } else {
        console.log('No stats found or response not successful');
      }
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await apiService.markNotificationAsRead(id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        );
        loadStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      showToast('Failed to mark notification as read', 'error');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await apiService.markAllNotificationsAsRead();
      if (response.success) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        loadStats(); // Refresh stats
        showToast('All notifications marked as read', 'success');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      showToast('Failed to mark all notifications as read', 'error');
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await apiService.deleteNotification(id);
      if (response.success) {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        loadStats(); // Refresh stats
        showToast('Notification deleted', 'success');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      showToast('Failed to delete notification', 'error');
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(page + 1, true);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'WARNING':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  // Get notification type color
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'WARNING':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'ERROR':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadNotifications(1, false);
      loadStats();
    }
  }, [isOpen]);

  // Preload notifications and stats when component mounts
  useEffect(() => {
    loadNotifications(1, false);
    loadStats();
  }, []);

  // Auto-refresh notifications every 30 seconds when dropdown is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      loadNotifications(1, false);
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const unreadCount = stats?.unreadCount || notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative z-50 notification-dropdown" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors z-50"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[99999] dropdown-content">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getNotificationTypeColor(notification.type)} ${
                      !notification.isRead ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {stats && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{stats.totalNotifications} total</span>
                <span>{stats.unreadCount} unread</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown; 