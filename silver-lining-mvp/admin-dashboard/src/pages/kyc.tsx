import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import ConfirmationDialog from '../components/ConfirmationDialog';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { kycApi } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import { logger } from '../utils/logger';

interface KYCApplication {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  remarks?: string;
  documents: {
    panNumber: string;
    aadhaarNumber: string;
    panImage?: string;
    aadhaarImage?: string;
    selfieImage?: string;
    verificationDetails?: {
      panVerified?: boolean;
      aadhaarVerified?: boolean;
      faceMatch?: number;
      addressMatch?: number;
    };
  };
  personalInfo: {
    notes?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: string;
    occupation?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
  };
}

const KYC: React.FC = () => {
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<KYCApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [kycToDelete, setKycToDelete] = useState<KYCApplication | null>(null);
  const { showToast } = useToast();

  // Fetch KYC applications
  const fetchKYCApplications = async () => {
    try {
      setLoading(true);
      const response = await kycApi.getAllKYC({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (response.success) {
        setApplications(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch KYC applications:', error);
      showToast('Failed to load KYC applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch KYC statistics
  const fetchKYCStats = async () => {
    try {
      const response = await kycApi.getKYCStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch KYC stats:', error);
    }
  };

  useEffect(() => {
    fetchKYCApplications();
    fetchKYCStats();
  }, [statusFilter, searchTerm, pagination.page]);

  const handleApprove = async (applicationId: string) => {
    try {
      const response = await kycApi.updateKYCStatus(applicationId, {
        status: 'APPROVED',
        notes: 'KYC approved by admin'
      });

      if (response.success) {
        // Log the KYC approval
        const application = applications.find(app => app.id === applicationId);
        if (application) {
          await logger.kycAction(
            'APPROVE',
            applicationId,
            `KYC application approved for user ${application.user.name} (${application.user.email})`,
            {
              userId: application.userId,
              userEmail: application.user.email,
              metadata: {
                kycStatus: 'APPROVED',
                userInfo: {
                  name: application.user.name,
                  email: application.user.email
                }
              }
            }
          );
        }
        
        showToast('KYC application approved successfully', 'success');
        setShowModal(false);
        fetchKYCApplications();
        fetchKYCStats();
      }
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      showToast('Failed to approve KYC application', 'error');
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'warning');
      return;
    }

    try {
      const response = await kycApi.updateKYCStatus(applicationId, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        notes: `Rejected: ${rejectionReason.trim()}`
      });

      if (response.success) {
        // Log the KYC rejection
        const application = applications.find(app => app.id === applicationId);
        if (application) {
          await logger.kycAction(
            'REJECT',
            applicationId,
            `KYC application rejected for user ${application.user.name} (${application.user.email})`,
            {
              userId: application.userId,
              userEmail: application.user.email,
              metadata: {
                kycStatus: 'REJECTED',
                rejectionReason: rejectionReason.trim(),
                userInfo: {
                  name: application.user.name,
                  email: application.user.email
                }
              }
            }
          );
        }
        
        showToast('KYC application rejected successfully', 'success');
        setRejectionReason('');
        setShowModal(false);
        fetchKYCApplications();
        fetchKYCStats();
      }
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      showToast('Failed to reject KYC application', 'error');
    }
  };

  const handleDelete = (application: KYCApplication) => {
    setKycToDelete(application);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!kycToDelete) return;

    try {
      const response = await kycApi.deleteKYC(kycToDelete.id);
      if (response && response.success) {
        // Log the KYC deletion
        await logger.kycAction(
          'DELETE',
          kycToDelete.id,
          `KYC application deleted for user ${kycToDelete.user.name} (${kycToDelete.user.email})`,
          {
            userId: kycToDelete.userId,
            userEmail: kycToDelete.user.email,
            metadata: {
              kycStatus: kycToDelete.status,
              userInfo: {
                name: kycToDelete.user.name,
                email: kycToDelete.user.email
              }
            }
          }
        );
        
        showToast('KYC application deleted successfully', 'success');
        setShowDeleteDialog(false);
        setKycToDelete(null);
        fetchKYCApplications();
        fetchKYCStats();
      } else {
        showToast(response?.error || 'Failed to delete KYC application', 'error');
      }
    } catch (error) {
      console.error('Failed to delete KYC:', error);
      showToast('Failed to delete KYC application', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
    }
  };

  const getVerificationStatus = (verified?: boolean) => {
    if (verified === undefined) return <ClockIcon className="h-4 w-4 text-slate-400" />;
    return verified ? (
      <CheckIcon className="h-4 w-4 text-emerald-500" />
    ) : (
      <XMarkIcon className="h-4 w-4 text-red-500" />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            <h1 className="text-3xl font-bold text-gradient">KYC Review</h1>
            <p className="mt-2 text-lg text-dark-tertiary">
              Review and verify user KYC applications
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {stats && (
              <div className="text-sm text-dark-secondary">
                <span className="font-semibold text-dark-primary">{stats.pendingApplications}</span> pending reviews
              </div>
            )}
          </div>
        </motion.div>

        {/* Statistics Cards */}
        {stats && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-secondary">Total Applications</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-primary truncate">{stats.totalApplications}</p>
                </div>
                <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-secondary">Pending</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-600 truncate">{stats.pendingApplications}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-amber-500" />
              </div>
            </div>
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-secondary">Approved</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600 truncate">{stats.approvedApplications}</p>
                </div>
                <CheckIcon className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-secondary">Rejected</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 truncate">{stats.rejectedApplications}</p>
                </div>
                <XMarkIcon className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="premium-card p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, PAN, or Aadhaar..."
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
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Sort by date */}
            <select className="input-field">
              <option>Sort by Date (Newest)</option>
              <option>Sort by Date (Oldest)</option>
              <option>Sort by Name</option>
            </select>
          </div>
        </motion.div>

        {/* KYC Applications table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="premium-card overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-dark-secondary">Loading KYC applications...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                        Verification Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-slate-200 dark:divide-slate-700">
                    {applications.map((application, index) => (
                      <motion.tr 
                        key={application.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                        className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                              <span className="text-white font-semibold text-sm">
                                {application.user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-dark-primary">{application.user.name}</div>
                              <div className="text-sm text-dark-tertiary">{application.user.email}</div>
                              <div className="text-xs text-dark-muted">{application.user.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-dark-primary">
                            <div>PAN: <span className="font-mono text-dark-secondary">{application.documents.panNumber}</span></div>
                            <div>Aadhaar: <span className="font-mono text-dark-secondary">{application.documents.aadhaarNumber}</span></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-dark-secondary">PAN:</span>
                              {getVerificationStatus(application.documents.verificationDetails?.panVerified)}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-dark-secondary">Aadhaar:</span>
                              {getVerificationStatus(application.documents.verificationDetails?.aadhaarVerified)}
                            </div>
                            {application.documents.verificationDetails?.faceMatch !== undefined && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-dark-secondary">Face Match:</span>
                                <span className={`text-xs font-semibold ${application.documents.verificationDetails.faceMatch > 0.8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {(application.documents.verificationDetails.faceMatch * 100).toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                            {application.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-tertiary">
                          {formatDate(application.submittedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <motion.button 
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </motion.button>
                            {application.status === 'PENDING' && (
                              <>
                                <motion.button 
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleApprove(application.id)}
                                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200"
                                >
                                  <CheckIcon className="h-5 w-5" />
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    setSelectedApplication(application);
                                    setShowModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </motion.button>
                              </>
                            )}
                            <motion.button 
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(application)}
                              className="text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors duration-200"
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
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-dark-secondary">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-dark-secondary">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={!pagination.hasNext}
                        className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* KYC Review Modal */}
        {showModal && selectedApplication && (
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
              className="premium-card max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gradient">
                    KYC Review - {selectedApplication.user.name}
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
                {/* User Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="premium-card p-6">
                    <h4 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      User Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Name:</span>
                        <span className="text-dark-primary">{selectedApplication.user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Email:</span>
                        <span className="text-dark-primary">{selectedApplication.user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Phone:</span>
                        <span className="text-dark-primary">{selectedApplication.user.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Submitted:</span>
                        <span className="text-dark-primary">{formatDate(selectedApplication.submittedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="premium-card p-6">
                    <h4 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                      <CheckIcon className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                      Verification Status
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-dark-secondary">PAN Verification:</span>
                        {getVerificationStatus(selectedApplication.documents.verificationDetails?.panVerified)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-dark-secondary">Aadhaar Verification:</span>
                        {getVerificationStatus(selectedApplication.documents.verificationDetails?.aadhaarVerified)}
                      </div>
                      {selectedApplication.documents.verificationDetails?.faceMatch !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-dark-secondary">Face Match Score:</span>
                          <span className={`font-semibold ${selectedApplication.documents.verificationDetails.faceMatch > 0.8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {(selectedApplication.documents.verificationDetails.faceMatch * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Images */}
                <div className="premium-card p-6">
                  <h4 className="text-lg font-semibold text-dark-primary mb-6 flex items-center">
                    <PhotoIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="premium-card p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center space-x-2 mb-3">
                        <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-dark-primary">PAN Card</span>
                      </div>
                      <div className="bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 h-32 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">PAN Image</span>
                      </div>
                      <div className="mt-3 text-xs text-dark-muted font-mono">{selectedApplication.documents.panNumber}</div>
                    </div>

                    <div className="premium-card p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center space-x-2 mb-3">
                        <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-dark-primary">Aadhaar Card</span>
                      </div>
                      <div className="bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 h-32 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Aadhaar Image</span>
                      </div>
                      <div className="mt-3 text-xs text-dark-muted font-mono">{selectedApplication.documents.aadhaarNumber}</div>
                    </div>

                    <div className="premium-card p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center space-x-2 mb-3">
                        <PhotoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-dark-primary">Selfie</span>
                      </div>
                      <div className="bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 h-32 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Selfie Image</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="premium-card p-6">
                  <h4 className="text-lg font-semibold text-dark-primary mb-4 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Notes
                  </h4>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={selectedApplication.remarks || selectedApplication.personalInfo.notes || ''}
                    readOnly
                  />
                </div>

                {/* Actions */}
                {selectedApplication.status === 'PENDING' && (
                  <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApprove(selectedApplication.id)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>Approve KYC</span>
                    </motion.button>
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="Rejection reason..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="input-field"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReject(selectedApplication.id)}
                        disabled={!rejectionReason.trim()}
                        className="btn-danger flex items-center space-x-2 disabled:opacity-50"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        <span>Reject</span>
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Delete KYC Application"
          message={`Are you sure you want to delete the KYC application for ${kycToDelete?.user.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </Layout>
  );
};

export default KYC; 