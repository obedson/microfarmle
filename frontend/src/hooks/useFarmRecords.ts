import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmRecordsApi, FarmRecord } from '../api/farmRecords';

export const useFarmRecords = () => {
  return useQuery({
    queryKey: ['farmRecords'],
    queryFn: async () => {
      const response = await farmRecordsApi.getMyRecords();
      return response.data;
    }
  });
};

export const useFarmAnalytics = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['farmAnalytics', startDate, endDate],
    queryFn: async () => {
      console.log('Fetching analytics for:', { startDate, endDate });
      const response = await farmRecordsApi.getAnalytics(startDate, endDate);
      console.log('Analytics response:', response.data);
      return response.data;
    },
    enabled: !!startDate && !!endDate
  });
};

export const useCreateFarmRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: farmRecordsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmRecords'] });
      queryClient.invalidateQueries({ queryKey: ['farmAnalytics'] });
    }
  });
};

export const useUpdateFarmRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FarmRecord> }) =>
      farmRecordsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmRecords'] });
      queryClient.invalidateQueries({ queryKey: ['farmAnalytics'] });
    }
  });
};

export const useDeleteFarmRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: farmRecordsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmRecords'] });
      queryClient.invalidateQueries({ queryKey: ['farmAnalytics'] });
    }
  });
};
