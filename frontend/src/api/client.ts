import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: any) =>
    apiClient.post('/auth/register', data),
};

export const propertyAPI = {
  getAll: (filters?: any) =>
    apiClient.get('/properties', { params: filters }),
  getById: (id: string) =>
    apiClient.get(`/properties/${id}`),
  create: (data: any) =>
    apiClient.post('/properties', data),
  update: (id: string, data: any) => {
    const headers: any = {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    
    // Don't set Content-Type for FormData
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      data = JSON.stringify(data);
    }
    
    return apiClient.put(`/properties/${id}`, data, { headers });
  },
  delete: (id: string) =>
    apiClient.delete(`/properties/${id}`),
};

export const bookingAPI = {
  create: (data: any) =>
    apiClient.post('/bookings', data),
  getMyBookings: () =>
    apiClient.get('/bookings/my-bookings'),
};

export const paymentAPI = {
  initialize: (booking_id: string) =>
    apiClient.post('/payments/initialize', { booking_id }),
  verify: (reference: string) =>
    apiClient.get(`/payments/verify/${reference}`),
};
