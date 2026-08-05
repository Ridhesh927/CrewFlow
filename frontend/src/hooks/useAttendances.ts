import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executeApiRequest } from '../services/api';

export const useGetAttendances = () => {
  return useQuery({
    queryKey: ['attendances'],
    queryFn: () => executeApiRequest('/attendances'),
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => executeApiRequest('/attendances/mark', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
    }
  });
};
