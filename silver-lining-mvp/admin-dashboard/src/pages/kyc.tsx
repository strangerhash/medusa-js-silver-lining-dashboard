import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Mock KYC data
const mockKycApplications = [
  {
    id: 1,
    userId: 101,
    userName: 'Priya Sharma',
    userEmail: 'priya.sharma@email.com',
    userPhone: '+91 87654 32109',
    status: 'Pending',
    submittedDate: '2024-01-20',
    documents: {
      pan: 'ABCDE1234F',
      aadhaar: '1234-5678-9012',
      panImage: '/api/documents/pan_101.jpg',
      aadhaarImage: '/api/documents/aadhaar_101.jpg',
      selfie: '/api/documents/selfie_101.jpg'
    },
    verificationDetails: {
      panVerified: true,
      aadhaarVerified: false,
      faceMatch: null,
      addressMatch: null
    },
    notes: 'Aadhaar verification pending due to poor image quality'
  },
  {
    id: 2,
    userId: 102,
    userName: 'Rajesh Kumar',
    userEmail: 'rajesh.kumar@email.com',
    userPhone: '+91 76543 21098',
    status: 'Pending',
    submittedDate: '2024-01-19',
    documents: {
      pan: 'FGHIJ5678K',
      aadhaar: '2345-6789-0123',
      panImage: '/api/documents/pan_102.jpg',
      aadhaarImage: '/api/documents/aadhaar_102.jpg',
      selfie: '/api/documents/selfie_102.jpg'
    },
    verificationDetails: {
      panVerified: true,
      aadhaarVerified: true,
      faceMatch: 0.95,
      addressMatch: 0.98
    },
    notes: 'All documents verified successfully'
  },
  {
    id: 3,
    userId: 103,
    userName: 'Anita Patel',
    userEmail: 'anita.patel@email.com',
    userPhone: '+91 65432 10987',
    status: 'Rejected',
    submittedDate: '2024-01-18',
    documents: {
      pan: 'KLMNO9012P',
      aadhaar: '3456-7890-1234',
      panImage: '/api/documents/pan_103.jpg',
      aadhaarImage: '/api/documents/aadhaar_103.jpg',
      selfie: '/api/documents/selfie_103.jpg'
    },
    verificationDetails: {
      panVerified: false,
      aadhaarVerified: false,
      faceMatch: 0.45,
      addressMatch: 0.30
    },
    notes: 'PAN and Aadhaar verification failed. Documents appear to be fake.'
  },
  {
    id: 4,
    userId: 104,
    userName: 'Vikram Singh',
    userEmail: 'vikram.singh@email.com',
    userPhone: '+91 54321 09876',
    status: 'Approved',
    submittedDate: '2024-01-17',
    documents: {
      pan: 'PQRST3456U',
      aadhaar: '4567-8901-2345',
      panImage: '/api/documents/pan_104.jpg',
      aadhaarImage: '/api/documents/aadhaar_104.jpg',
      selfie: '/api/documents/selfie_104.jpg'
    },
    verificationDetails: {
      panVerified: true,
      aadhaarVerified: true,
      faceMatch: 0.92,
      addressMatch: 0.95
    },
    notes: 'KYC approved successfully'
  }
];

const KYC: React.FC = () => {
  const [applications, setApplications] = useState(mockKycApplications);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.documents.pan.includes(searchTerm) ||
                         app.documents.aadhaar.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (applicationId: number) => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId ? { ...app, status: 'Approved' } : app
    ));
    setShowModal(false);
  };

  const handleReject = (applicationId: number) => {
    if (rejectionReason.trim()) {
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { 
          ...app, 
          status: 'Rejected',
          notes: `Rejected: ${rejectionReason}`
        } : app
      ));
      setRejectionReason('');
      setShowModal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
    }
  };

  const getVerificationStatus = (verified: boolean) => {
    return verified ? (
      <CheckIcon className="h-4 w-4 text-emerald-500" />
    ) : (
      <XMarkIcon className="h-4 w-4 text-red-500" />
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
            <h1 className="text-3xl font-bold text-gradient">KYC Review</h1>
            <p className="mt-2 text-lg text-dark-tertiary">
              Review and verify user KYC applications
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-dark-secondary">
              <span className="font-semibold text-dark-primary">{applications.filter(a => a.status === 'Pending').length}</span> pending reviews
            </div>
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
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
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
                {filteredApplications.map((application, index) => (
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
                            {application.userName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-dark-primary">{application.userName}</div>
                          <div className="text-sm text-dark-tertiary">{application.userEmail}</div>
                          <div className="text-xs text-dark-muted">{application.userPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-dark-primary">
                        <div>PAN: <span className="font-mono text-dark-secondary">{application.documents.pan}</span></div>
                        <div>Aadhaar: <span className="font-mono text-dark-secondary">{application.documents.aadhaar}</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-dark-secondary">PAN:</span>
                          {getVerificationStatus(application.verificationDetails.panVerified)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-dark-secondary">Aadhaar:</span>
                          {getVerificationStatus(application.verificationDetails.aadhaarVerified)}
                        </div>
                        {application.verificationDetails.faceMatch !== null && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-dark-secondary">Face Match:</span>
                            <span className={`text-xs font-semibold ${application.verificationDetails.faceMatch > 0.8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {(application.verificationDetails.faceMatch * 100).toFixed(1)}%
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
                      {application.submittedDate}
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
                        {application.status === 'Pending' && (
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
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    KYC Review - {selectedApplication.userName}
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
                        <span className="text-dark-primary">{selectedApplication.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Email:</span>
                        <span className="text-dark-primary">{selectedApplication.userEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Phone:</span>
                        <span className="text-dark-primary">{selectedApplication.userPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-dark-secondary">Submitted:</span>
                        <span className="text-dark-primary">{selectedApplication.submittedDate}</span>
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
                        {getVerificationStatus(selectedApplication.verificationDetails.panVerified)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-dark-secondary">Aadhaar Verification:</span>
                        {getVerificationStatus(selectedApplication.verificationDetails.aadhaarVerified)}
                      </div>
                      {selectedApplication.verificationDetails.faceMatch !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-dark-secondary">Face Match Score:</span>
                          <span className={`font-semibold ${selectedApplication.verificationDetails.faceMatch > 0.8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {(selectedApplication.verificationDetails.faceMatch * 100).toFixed(1)}%
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
                      <div className="mt-3 text-xs text-dark-muted font-mono">{selectedApplication.documents.pan}</div>
                    </div>

                    <div className="premium-card p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center space-x-2 mb-3">
                        <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-dark-primary">Aadhaar Card</span>
                      </div>
                      <div className="bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 h-32 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Aadhaar Image</span>
                      </div>
                      <div className="mt-3 text-xs text-dark-muted font-mono">{selectedApplication.documents.aadhaar}</div>
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
                    value={selectedApplication.notes}
                    readOnly
                  />
                </div>

                {/* Actions */}
                {selectedApplication.status === 'Pending' && (
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
      </div>
    </Layout>
  );
};

export default KYC; 