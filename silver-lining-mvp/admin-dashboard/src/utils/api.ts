const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      // Proactively refresh token if it's about to expire
      if (this.shouldRefreshToken() && !this.isRefreshing) {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          this.isRefreshing = true;
          try {
            console.log('Proactively refreshing token...');
            const refreshResponse = await this.refreshToken(refreshToken);
            this.setAuthToken(refreshResponse.accessToken);
            console.log('Token refreshed proactively');
          } catch (error) {
            console.error('Proactive token refresh failed:', error);
            this.logout();
            throw new Error('Session expired. Please login again.');
          } finally {
            this.isRefreshing = false;
          }
        }
      }
      
      const currentToken = this.getAuthToken();
      if (currentToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${currentToken}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 && retryCount === 0) {
        const refreshToken = this.getRefreshToken();
        if (refreshToken && !this.isRefreshing) {
          this.isRefreshing = true;
          
          try {
            console.log('Token expired, attempting refresh...');
            const refreshResponse = await this.refreshToken(refreshToken);
            this.setAuthToken(refreshResponse.accessToken);
            this.processQueue(null, refreshResponse.accessToken);
            console.log('Token refreshed successfully');
            
            // Retry the original request with new token
            return this.request(endpoint, options, retryCount + 1);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.processQueue(refreshError, null);
            this.logout();
            throw new Error('Session expired. Please login again.');
          } finally {
            this.isRefreshing = false;
          }
        } else if (this.isRefreshing) {
          // Wait for the refresh to complete
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(() => {
            return this.request(endpoint, options, retryCount + 1);
          });
        } else {
          console.log('No refresh token available, logging out');
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  private setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  private removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  private setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    }
  }

  private removeRefreshToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refreshToken');
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  private shouldRefreshToken(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      // Refresh if token expires in less than 5 minutes
      return payload.exp - currentTime < 300;
    } catch (error) {
      return true;
    }
  }

  // Connection test
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/admin/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setAuthToken(response.data.accessToken);
      this.setRefreshToken(response.data.refreshToken);
      return response.data;
    }

    throw new Error(response.error || 'Login failed');
  }

  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ user: User }> {
    const response = await this.request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Registration failed');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeAuthToken();
      this.removeRefreshToken();
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.success && response.data) {
      this.setAuthToken(response.data.accessToken);
      return response.data;
    }

    throw new Error(response.error || 'Token refresh failed');
  }

  // Users
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    items: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await this.request<{
      users: User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/users?${queryParams.toString()}`);

    if (response.success && response.data) {
      // Transform the response to match the expected structure
      return {
        items: response.data.users,
        pagination: response.data.pagination
      };
    }

    throw new Error(response.error || 'Failed to fetch users');
  }

  async getUser(id: string): Promise<User> {
    const response = await this.request<User>(`/users/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch user');
  }

  async createUser(userData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role?: string;
    status?: string;
  }): Promise<User> {
    const response = await this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create user');
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update user');
  }

  async deleteUser(id: string): Promise<void> {
    const response = await this.request(`/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete user');
    }
  }

  // KYC Applications
  async getKYCApplications(): Promise<any[]> {
    const response = await this.request<any[]>('/kyc');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch KYC applications');
  }

  async updateKYCStatus(id: string, status: string, notes?: string): Promise<any> {
    const response = await this.request<any>(`/kyc/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update KYC status');
  }

  // Transactions
  // Transactions
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    userId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await this.request<any>(`/transactions?${queryParams.toString()}`);

    if (response.success && response.data) {
      return {
        data: response.data.transactions || response.data,
        pagination: response.data.pagination || response.pagination
      };
    }

    throw new Error(response.error || 'Failed to fetch transactions');
  }

  async getTransaction(id: string): Promise<any> {
    const response = await this.request<any>(`/transactions/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch transaction');
  }

  async createTransaction(transactionData: {
    userId: string;
    type: string;
    amount: number;
    silverQuantity: number;
    silverPrice: number;
    paymentMethod: string;
    referenceId?: string;
    fees?: number;
    totalAmount?: number;
    details?: any;
    remarks?: string;
  }): Promise<any> {
    const response = await this.request<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create transaction');
  }

  async updateTransaction(id: string, transactionData: {
    status?: string;
    remarks?: string;
    details?: any;
  }): Promise<any> {
    const response = await this.request<any>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update transaction');
  }

  async deleteTransaction(id: string): Promise<void> {
    const response = await this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete transaction');
    }
  }

  async bulkUpdateTransactions(transactionIds: string[], status: string, remarks?: string): Promise<any> {
    const response = await this.request<any>('/transactions/bulk/status', {
      method: 'PUT',
      body: JSON.stringify({ transactionIds, status, remarks }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to bulk update transactions');
  }

  async getTransactionStats(): Promise<any> {
    const response = await this.request<any>('/transactions/stats');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch transaction statistics');
  }

  async getTransactionAnalytics(params?: {
    period?: string;
    type?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await this.request<any>(`/analytics/transactions?${queryParams.toString()}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch transaction analytics');
  }

  // Portfolio
  async getPortfolios(params?: {
    page?: number;
    limit?: number;
    search?: string;
    minValue?: number;
    maxValue?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await this.request<any>(`/portfolio?${queryParams.toString()}`);

    if (response.success && response.data) {
      return {
        data: response.data.portfolios || response.data,
        pagination: response.data.pagination || response.pagination
      };
    }

    throw new Error(response.error || 'Failed to fetch portfolios');
  }

  async getPortfolio(id: string): Promise<any> {
    const response = await this.request<any>(`/portfolio/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch portfolio');
  }

  async getUserPortfolio(userId: string): Promise<any> {
    const response = await this.request<any>(`/portfolio/user/${userId}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch user portfolio');
  }

  async createPortfolio(portfolioData: {
    userId: string;
    totalSilverHolding: number;
    totalInvested: number;
    currentValue: number;
    currentSilverPrice: number;
    holdings?: any[];
    performance?: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
  }): Promise<any> {
    const response = await this.request<any>('/portfolio', {
      method: 'POST',
      body: JSON.stringify(portfolioData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create portfolio');
  }

  async updatePortfolio(id: string, portfolioData: {
    totalSilverHolding?: number;
    totalInvested?: number;
    currentValue?: number;
    currentSilverPrice?: number;
    holdings?: any[];
    performance?: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
  }): Promise<any> {
    const response = await this.request<any>(`/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(portfolioData),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update portfolio');
  }

  async deletePortfolio(id: string): Promise<void> {
    const response = await this.request(`/portfolio/${id}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete portfolio');
    }
  }

  async getPortfolioStats(): Promise<any> {
    const response = await this.request<any>('/portfolio/stats');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch portfolio statistics');
  }

  async getPortfolioAnalytics(params?: {
    period?: string;
    minValue?: number;
    maxValue?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await this.request<any>(`/portfolio/analytics/detailed?${queryParams.toString()}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch portfolio analytics');
  }

  async syncPortfolio(id: string): Promise<any> {
    const response = await this.request<any>(`/portfolio/${id}/sync`, {
      method: 'POST',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to sync portfolio');
  }

  // Analytics
  async getAnalyticsDashboard(): Promise<any> {
    const response = await this.request('/analytics/dashboard', { method: 'GET' });
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to fetch analytics dashboard');
  }

  async getUserAnalytics(): Promise<any> {
    const response = await this.request('/analytics/users', { method: 'GET' });
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to fetch user analytics');
  }

  async getFinancialAnalytics(): Promise<any> {
    const response = await this.request('/analytics/financial', { method: 'GET' });
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to fetch financial analytics');
  }

  // Notifications


  // Settings
  async getSettings(): Promise<any[]> {
    const response = await this.request<any[]>('/settings');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch settings');
  }

  async updateSetting(key: string, value: string): Promise<any> {
    const response = await this.request<any>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update setting');
  }

  // Admin
  async getAdminDashboard(): Promise<any> {
    const response = await this.request<any>('/admin/dashboard');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch admin dashboard');
  }

  async getSystemStats(): Promise<any> {
    const response = await this.request<any>('/admin/stats');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch system stats');
  }

  // Logs methods
  async getLogs(params: {
    level?: string;
    category?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request(`/logs?${queryParams.toString()}`);
  }

  async getAuditLogs(params: {
    userId?: string;
    resource?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request(`/logs/audit?${queryParams.toString()}`);
  }

  async getLogStats(): Promise<ApiResponse<any>> {
    return this.request('/logs/stats');
  }

  async getUserLogs(userId: string, params: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request(`/logs/user/${userId}?${queryParams.toString()}`);
  }

  // Enhanced Notifications methods
  async getNotifications(params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request(`/notifications?${queryParams.toString()}`);
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<any>> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT'
    });
  }

  async deleteNotification(id: string): Promise<ApiResponse<any>> {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE'
    });
  }

  async getNotificationStats(): Promise<ApiResponse<any>> {
    return this.request('/notifications/stats');
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<any>> {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async sendTemplateNotification(templateId: string, data: {
    userId: string;
    variables: Record<string, any>;
  }): Promise<ApiResponse<any>> {
    return this.request(`/notifications/template/${templateId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async createSystemNotification(data: {
    title: string;
    message: string;
    type: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<any>> {
    return this.request('/notifications/system', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAllNotifications(params: {
    page?: number;
    limit?: number;
    type?: string;
    unreadOnly?: boolean;
    userId?: string;
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request(`/notifications/all?${queryParams.toString()}`);
  }

  // Logging
  async createLog(logEntry: {
    level: string;
    category: string;
    message: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    userId?: string;
    userEmail?: string;
    metadata?: Record<string, any>;
    timestamp?: Date;
  }): Promise<ApiResponse<any>> {
    return this.request('/logs', {
      method: 'POST',
      body: JSON.stringify(logEntry)
    });
  }
}

export const apiService = new ApiService(); 

// KYC API functions - using the existing ApiService pattern
export const kycApi = {
  // Get all KYC applications with pagination and filtering
  getAllKYC: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await fetch(`${API_BASE_URL}/kyc?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch KYC applications');
    }

    return response.json();
  },

  // Get KYC by ID
  getKYCById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/kyc/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch KYC application');
    }

    return response.json();
  },

  // Update KYC status (approve/reject)
  updateKYCStatus: async (id: string, data: {
    status: 'APPROVED' | 'REJECTED';
    notes?: string;
    rejectionReason?: string;
    verificationDetails?: {
      panVerified?: boolean;
      aadhaarVerified?: boolean;
      faceMatch?: number;
      addressMatch?: number;
    };
  }) => {
    const response = await fetch(`${API_BASE_URL}/kyc/${id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update KYC status');
    }

    return response.json();
  },

  // Bulk update KYC status
  bulkUpdateKYCStatus: async (data: {
    kycIds: string[];
    status: 'APPROVED' | 'REJECTED';
    notes?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/kyc/bulk/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk update KYC status');
    }

    return response.json();
  },

  // Delete KYC application
  deleteKYC: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/kyc/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete KYC application');
    }

    return response.json();
  },

  // Get KYC statistics
  getKYCStats: async () => {
    const response = await fetch(`${API_BASE_URL}/kyc/stats/overview`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch KYC statistics');
    }

    return response.json();
  },

  // Get KYC by user
  getKYCByUser: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/kyc/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user KYC applications');
    }

    return response.json();
  },

  // Update KYC verification details
  updateKYCVerification: async (id: string, verificationDetails: any) => {
    const response = await fetch(`${API_BASE_URL}/kyc/${id}/verification`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verificationDetails }),
    });

    if (!response.ok) {
      throw new Error('Failed to update KYC verification details');
    }

    return response.json();
  },
}; 