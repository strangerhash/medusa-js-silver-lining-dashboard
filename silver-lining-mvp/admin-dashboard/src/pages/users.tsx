import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout/Layout';
import { apiService } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import { logger } from '../utils/logger';
import ConfirmationDialog from '../components/ConfirmationDialog';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UserPlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
// import { logger } from '../utils/logger';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UserWithKYC extends User {
  kycStatus?: string;
  totalInvested?: string;
  silverHolding?: string;
  lastActive?: string;
}

// Edit User Form Component
interface EditUserFormProps {
  user: UserWithKYC;
  onUpdate: (userData: Partial<UserWithKYC>) => void;
  onCancel: () => void;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ user, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    status: user.status,
    role: user.role
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-secondary mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field w-full"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-secondary mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="input-field w-full"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-secondary mb-1">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="input-field w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-secondary mb-1">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="input-field w-full"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-secondary mb-1">Role</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="input-field w-full"
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex-1"
        >
          Update User
        </button>
      </div>
    </form>
  );
};

const Users: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserWithKYC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithKYC | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithKYC | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const filteredUsers = users.filter(user => {
    // Only apply local filtering if search term is 1-2 characters
    const shouldApplyLocalFilter = debouncedSearchTerm && debouncedSearchTerm.length > 0 && debouncedSearchTerm.length < 3;
    
    const matchesSearch = shouldApplyLocalFilter ? 
      (user.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
       (user.phone && user.phone.includes(debouncedSearchTerm))) : true;
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesKyc = kycFilter === 'all' || user.kycStatus === kycFilter;
    
    return matchesSearch && matchesStatus && matchesKyc;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'INACTIVE': return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
      case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Reduced to 300ms for faster response

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users data - only for pagination and status filter changes
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const params: any = {
          page: pagination.page,
          limit: pagination.limit
        };
        
        // Only send search to API if it's a substantial search (not just a few characters)
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
          params.search = debouncedSearchTerm;
        }
        if (statusFilter !== 'all') params.status = statusFilter;
        
        const response = await apiService.getUsers(params);
        
        // Transform the data to include additional fields
        const transformedUsers: UserWithKYC[] = response.items.map((user: User) => ({
          ...user,
          kycStatus: 'Pending', // TODO: Get from KYC API
          totalInvested: '₹0', // TODO: Get from portfolio API
          silverHolding: '0g', // TODO: Get from portfolio API
          lastActive: new Date(user.updatedAt).toLocaleDateString('en-IN')
        }));
        
        setUsers(transformedUsers);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        });
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [pagination.page, pagination.limit, statusFilter, refreshTrigger]); // Added refreshTrigger dependency

  // Handle API search separately for substantial search terms
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
      const searchUsers = async () => {
        try {
          setIsSearching(true);
          setError('');
          
          const params: any = {
            page: 1, // Reset to first page when searching
            limit: pagination.limit,
            search: debouncedSearchTerm
          };
          
          if (statusFilter !== 'all') params.status = statusFilter;
          
          const response = await apiService.getUsers(params);
          
          // Transform the data to include additional fields
          const transformedUsers: UserWithKYC[] = response.items.map((user: User) => ({
            ...user,
            kycStatus: 'Pending', // TODO: Get from KYC API
            totalInvested: '₹0', // TODO: Get from portfolio API
            silverHolding: '0g', // TODO: Get from portfolio API
            lastActive: new Date(user.updatedAt).toLocaleDateString('en-IN')
          }));
          
          setUsers(transformedUsers);
          setPagination({
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages
          });
        } catch (err) {
          console.error('Error searching users:', err);
          setError('Failed to search users');
        } finally {
          setIsSearching(false);
        }
      };

      searchUsers();
    } else if (debouncedSearchTerm === '') {
      // If search is cleared, refetch all users
      const refetchUsers = async () => {
        try {
          setIsSearching(true);
          setError('');
          
          const params: any = {
            page: 1, // Reset to first page
            limit: pagination.limit
          };
          
          if (statusFilter !== 'all') params.status = statusFilter;
          
          const response = await apiService.getUsers(params);
          
          // Transform the data to include additional fields
          const transformedUsers: UserWithKYC[] = response.items.map((user: User) => ({
            ...user,
            kycStatus: 'Pending', // TODO: Get from KYC API
            totalInvested: '₹0', // TODO: Get from portfolio API
            silverHolding: '0g', // TODO: Get from portfolio API
            lastActive: new Date(user.updatedAt).toLocaleDateString('en-IN')
          }));
          
          setUsers(transformedUsers);
          setPagination({
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages
          });
        } catch (err) {
          console.error('Error refetching users:', err);
          setError('Failed to load users');
        } finally {
          setIsSearching(false);
        }
      };

      refetchUsers();
    }
  }, [debouncedSearchTerm, statusFilter, pagination.limit, refreshTrigger]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const refreshUserList = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewUser = (user: UserWithKYC) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleEditUser = (user: UserWithKYC) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: UserWithKYC) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      // Store the count before clearing
      const deletedCount = selectedUsers.length;
      
      // Delete each selected user
      await Promise.all(selectedUsers.map(userId => apiService.deleteUser(userId)));
      
      // Clear selected users first
      setSelectedUsers([]);
      
      // Show success toast first
      showToast(`Successfully deleted ${deletedCount} user(s)`, 'success');
      
      // Then refresh the user list
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
      refreshUserList(); // Trigger data refresh
      
      // Log the bulk delete action
      await logger.userAction(
        'BULK_DELETE',
        'USER',
        'multiple',
        `Bulk deleted ${deletedCount} users`,
        {
          metadata: {
            deletedCount,
            action: 'BULK_DELETE'
          }
        }
      );
      
    } catch (err) {
      console.error('Error deleting users:', err);
      showToast('Failed to delete some users. Please try again.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      console.log('Attempting to delete user:', userToDelete.id);
      await apiService.deleteUser(userToDelete.id);
      console.log('User deleted successfully');
      
      // Log the user deletion
      await logger.userAction(
        'DELETE',
        'USER',
        userToDelete.id,
        `User ${userToDelete.name} (${userToDelete.email}) deleted by admin`,
        {
          userId: userToDelete.id,
          userEmail: userToDelete.email,
          metadata: {
            deletedUser: {
              name: userToDelete.name,
              email: userToDelete.email,
              role: userToDelete.role,
              status: userToDelete.status
            }
          }
        }
      );
      
      // Store user name before clearing the state
      const deletedUserName = userToDelete.name;
      
      // Close modal and clear state
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      // Show success toast first
      showToast(`Successfully deleted ${deletedUserName}`, 'success');
      
      // Then refresh the user list
      setPagination(prev => ({ ...prev, page: 1 }));
      refreshUserList(); // Trigger data refresh
      
    } catch (err) {
      console.error('Error deleting user:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        user: userToDelete
      });
      showToast('Failed to delete user. Please try again.', 'error');
    }
  };

  const handleUpdateUser = async (updatedUser: Partial<UserWithKYC>) => {
    if (!selectedUser) return;

    try {
      await apiService.updateUser(selectedUser.id, updatedUser);
      
      // Log the user update
      await logger.userAction(
        'UPDATE',
        'USER',
        selectedUser.id,
        `User ${selectedUser.name} (${selectedUser.email}) updated by admin`,
        {
          userId: selectedUser.id,
          userEmail: selectedUser.email,
          metadata: {
            updatedFields: updatedUser,
            previousData: {
              name: selectedUser.name,
              email: selectedUser.email,
              role: selectedUser.role,
              status: selectedUser.status
            }
          }
        }
      );
      
      showToast(`Successfully updated ${selectedUser.name}`, 'success');
      setShowEditModal(false);
      setSelectedUser(null);
      // Refresh the user list
      setPagination(prev => ({ ...prev, page: 1 }));
      refreshUserList(); // Trigger data refresh
    } catch (err) {
      showToast('Failed to update user. Please try again.', 'error');
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-dark-secondary">Loading users...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

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
            <h1 className="text-3xl font-bold text-gradient">User Management</h1>
            <p className="mt-2 text-lg text-dark-tertiary">
              Manage platform users, view profiles, and handle KYC status
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary flex items-center space-x-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            <span>Add User</span>
          </motion.button>
        </motion.div>

        {/* Filters and search */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="premium-card p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="input-field pl-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
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

            {/* KYC filter */}
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All KYC Status</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Actions */}
            <div className="flex space-x-2">
              <motion.button 
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary flex items-center space-x-1"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filter</span>
              </motion.button>
              {selectedUsers.length > 0 && (
                <motion.button 
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-danger flex items-center space-x-1"
                  onClick={handleDeleteUsers}
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete ({selectedUsers.length})</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Users table */}
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
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    KYC Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Investment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-slate-200 dark:divide-slate-700">
                {filteredUsers.map((user, index) => (
                  <motion.tr 
                    key={user.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-gray-800 transition-all duration-300"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                          <span className="text-white font-semibold text-sm">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-dark-primary">{user.name}</div>
                          <div className="text-sm text-dark-tertiary">{user.email}</div>
                          <div className="text-xs text-dark-muted">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getKycStatusColor(user.kycStatus)}`}>
                        {user.kycStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-dark-primary">{user.totalInvested}</div>
                      <div className="text-xs text-dark-tertiary">{user.silverHolding}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-tertiary">
                      {formatDate(user.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <motion.button 
                          type="button"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                          onClick={() => handleViewUser(user)}
                          title="View User"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </motion.button>
                        <motion.button 
                          type="button"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors duration-200"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </motion.button>
                        <motion.button 
                          type="button"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                          onClick={() => handleDeleteUser(user)}
                          title="Delete User"
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
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </motion.button>
              <motion.button 
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </motion.button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-dark-secondary">
                  Showing <span className="font-semibold text-dark-primary">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-semibold text-dark-primary">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="font-semibold text-dark-primary">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </motion.button>
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </motion.button>
                </nav>
              </div>
            </div>
          </div>
        </motion.div>

        {/* View User Modal */}
        {showViewModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-dark-primary">User Details</h3>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-1">Name</label>
                  <p className="text-dark-primary">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-1">Email</label>
                  <p className="text-dark-primary">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-1">Phone</label>
                  <p className="text-dark-primary">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-1">Role</label>
                  <p className="text-dark-primary">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-secondary mb-1">Created</label>
                  <p className="text-dark-primary">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-dark-primary">Edit User</h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <EditUserForm 
                user={selectedUser} 
                onUpdate={handleUpdateUser}
                onCancel={() => setShowEditModal(false)}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showBulkDeleteDialog}
          onClose={() => setShowBulkDeleteDialog(false)}
          onConfirm={handleConfirmBulkDelete}
          title="Delete Multiple Users"
          message={`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`}
          confirmText="Delete All"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </Layout>
  );
};

export default Users; 