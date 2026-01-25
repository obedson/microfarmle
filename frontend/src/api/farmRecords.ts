import { apiClient } from './client';

export interface FarmRecord {
  id: string;
  farmer_id: string;
  property_id: string;
  livestock_type: string;
  livestock_count: number;
  feed_consumption: number;
  mortality_count: number;
  expenses: number;
  expense_category: string;
  notes?: string;
  record_date: string;
  created_at: string;
}

export interface FarmAnalytics {
  totalLivestock: number;
  totalFeedConsumption: number;
  totalMortality: number;
  totalExpenses: number;
  mortalityRate: number;
  recordCount: number;
}

export const farmRecordsApi = {
  create: (data: Omit<FarmRecord, 'id' | 'farmer_id' | 'created_at'>) =>
    apiClient.post('/farm-records', data),

  getMyRecords: () =>
    apiClient.get('/farm-records/my-records'),

  getAnalytics: (startDate: string, endDate: string) =>
    apiClient.get(`/farm-records/analytics?startDate=${startDate}&endDate=${endDate}`),

  update: (id: string, data: Partial<FarmRecord>) =>
    apiClient.put(`/farm-records/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/farm-records/${id}`)
};
