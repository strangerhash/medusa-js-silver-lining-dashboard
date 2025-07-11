const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
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

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
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
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

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

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setAuthToken(response.data.accessToken);
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
  async getTransactions(): Promise<any[]> {
    const response = await this.request<any[]>('/transactions');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch transactions');
  }

  async updateTransactionStatus(id: string, status: string): Promise<any> {
    const response = await this.request<any>(`/transactions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update transaction status');
  }

  // Analytics
  async getDashboardAnalytics(): Promise<any> {
    const response = await this.request<any>('/analytics/dashboard');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch dashboard analytics');
  }

  async getUserAnalytics(): Promise<any> {
    const response = await this.request<any>('/analytics/users');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch user analytics');
  }

  async getTransactionAnalytics(): Promise<any> {
    const response = await this.request<any>('/analytics/transactions');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch transaction analytics');
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    const response = await this.request<any[]>('/notifications');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch notifications');
  }

  async markNotificationAsRead(id: string): Promise<any> {
    const response = await this.request<any>(`/notifications/${id}/read`, {
      method: 'PUT',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to mark notification as read');
  }

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
}

export const apiService = new ApiService(); 