import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executeApiRequest } from '../services/api';

export const useGetAttendances = (startDate?: string, endDate?: string) => {
  const isValidRange = !startDate || !endDate || startDate <= endDate;
  return useQuery({
    queryKey: ['attendances', startDate, endDate],
    queryFn: () => {
      let url = '/attendances';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      return executeApiRequest(url);
    },
    enabled: isValidRange,
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  type MarkAttendancePayload = {
    targetUserId: number;
    date: string;
    status: string;
    remarks?: string;
  };

  return useMutation({
    mutationFn: (data: MarkAttendancePayload) => executeApiRequest('/attendances/mark', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
    }
  });
};
