import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Calendar,
  User,
  Activity,
  BarChart3,
  FileText,
  Shield
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../utils/api';

interface Log {
  id: string;
  level: string;
  category: string;
  message: string;
  userId?: string;
  userEmail?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  timestamp: string;
}

interface LogStats {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsByCategory: Record<string, number>;
  recentErrors: number;
  recentAuditLogs: number;
}

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'audit'>('logs');
  
  // Filters
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    userId: '',
    search: '',
    startDate: '',
    endDate: '',
    resource: '',
    resourceId: ''
  });

  const { showToast } = useToast();

  // Load logs
  const loadLogs = async (page: number = 1, isAudit: boolean = false) => {
    try {
      setLoading(true);
      
      const params: any = {
        page,
        limit: 20
      };

      if (isAudit) {
        // Audit logs
        if (filters.userId) params.userId = filters.userId;
        if (filters.resource) params.resource = filters.resource;
        if (filters.resourceId) params.resourceId = filters.resourceId;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const response = await apiService.getAuditLogs(params);
        if (response.success && response.data) {
          setLogs(response.data);
          setTotalPages(response.pagination?.totalPages || 1);
          setTotalLogs(response.pagination?.total || 0);
        }
      } else {
        // Regular logs
        if (filters.level) params.level = filters.level;
        if (filters.category) params.category = filters.category;
        if (filters.userId) params.userId = filters.userId;
        if (filters.search) params.search = filters.search;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const response = await apiService.getLogs(params);
        if (response.success && response.data) {
          setLogs(response.data);
          setTotalPages(response.pagination?.totalPages || 1);
          setTotalLogs(response.pagination?.total || 0);
        }
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      showToast('Failed to load logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await apiService.getLogStats();
      if (response.success && response.data) {
        const statsData = response.data;
        setStats({
          totalLogs: statsData.totalLogs || 0,
          logsByLevel: {
            ERROR: statsData.errorLogs || 0,
            WARN: statsData.warningLogs || 0,
            INFO: statsData.infoLogs || 0,
            AUDIT: statsData.auditLogs || 0
          },
          logsByCategory: statsData.categoryStats || {},
          recentErrors: statsData.errorLogs || 0,
          recentAuditLogs: statsData.auditLogs || 0
        });
      }
    } catch (error) {
      console.error('Failed to load log stats:', error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    loadLogs(1, activeTab === 'audit');
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      level: '',
      category: '',
      userId: '',
      search: '',
      startDate: '',
      endDate: '',
      resource: '',
      resourceId: ''
    });
    setCurrentPage(1);
    loadLogs(1, activeTab === 'audit');
  };

  // Export logs
  const exportLogs = () => {
    // This would implement CSV/JSON export functionality
    showToast('Export functionality coming soon', 'info');
  };

  // Get log level icon and color
  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'WARN':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'AUDIT':
        return <Shield className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'INFO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'AUDIT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Load data on mount and tab change
  useEffect(() => {
    loadLogs(1, activeTab === 'audit');
    loadStats();
  }, [activeTab]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadLogs(newPage, activeTab === 'audit');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor system activity and audit trails</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              loadLogs(currentPage, activeTab === 'audit');
              loadStats();
            }}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logs</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">{stats.totalLogs.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Errors</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">{stats.recentErrors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Audit Logs</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">{stats.recentAuditLogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">{Object.keys(stats?.logsByCategory || {}).length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            System Logs
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Audit Trail
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeTab === 'logs' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Level
                </label>
                <select
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Levels</option>
                  <option value="DEBUG">Debug</option>
                  <option value="INFO">Info</option>
                  <option value="WARN">Warning</option>
                  <option value="ERROR">Error</option>
                  <option value="AUDIT">Audit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="AUTH">Authentication</option>
                  <option value="USER">User</option>
                  <option value="TRANSACTION">Transaction</option>
                  <option value="PORTFOLIO">Portfolio</option>
                  <option value="KYC">KYC</option>
                  <option value="SYSTEM">System</option>
                  <option value="API">API</option>
                  <option value="SECURITY">Security</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'audit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resource
                </label>
                <input
                  type="text"
                  value={filters.resource}
                  onChange={(e) => handleFilterChange('resource', e.target.value)}
                  placeholder="e.g., USER, TRANSACTION"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resource ID
                </label>
                <input
                  type="text"
                  value={filters.resourceId}
                  onChange={(e) => handleFilterChange('resourceId', e.target.value)}
                  placeholder="Resource ID"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User ID
            </label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="User ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search in messages..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={applyFilters}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {activeTab === 'logs' ? 'System Logs' : 'Audit Trail'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalLogs.toLocaleString()} total entries
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getLogLevelIcon(log.level)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLogLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {log.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="max-w-xs truncate" title={log.message}>
                        {log.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {log.userEmail || log.userId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setShowLogModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Log Details</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Level</label>
                <div className="flex items-center space-x-2 mt-1">
                  {getLogLevelIcon(selectedLog.level)}
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${getLogLevelColor(selectedLog.level)}`}>
                    {selectedLog.level}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.category}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User ID</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.userId || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User Email</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.userEmail || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Action</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.action || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resource</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.resource || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resource ID</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.resourceId || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IP Address</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.ipAddress || '-'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timestamp</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedLog.timestamp)}</p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Metadata</label>
                  <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage; 