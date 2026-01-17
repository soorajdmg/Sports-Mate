import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/admin')) {
        window.location.href = '/login';
      } else {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  sendSignupOTP: (data) => api.post('/auth/signup/send-otp', data),
  verifySignupOTP: (data) => api.post('/auth/signup/verify-otp', data),
  sendLoginOTP: (data) => api.post('/auth/login/send-otp', data),
  verifyLoginOTP: (data) => api.post('/auth/login/verify-otp', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
};

// User APIs
export const userAPI = {
  getSports: () => api.get('/users/sports'),
  discoverTeammates: (params) => api.get('/users/discover', { params }),
  getNearbyTeammates: (params) => api.get('/users/nearby', { params }),
  getActiveTeammates: () => api.get('/users/active'),
};

// Admin APIs
export const adminAPI = {
  login: (data) => api.post('/admin/login', data),
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getCities: () => api.get('/admin/cities'),
  getAreas: (params) => api.get('/admin/areas', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;
