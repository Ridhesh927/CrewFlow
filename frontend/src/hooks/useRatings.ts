import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executeApiRequest } from '../services/api';

export const useGetRatings = () => {
  return useQuery({
    queryKey: ['ratings'],
    queryFn: () => executeApiRequest('/ratings'),
  });
};

export const useCreateRating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: number; rating: number; comments: string; month: string }) =>
      executeApiRequest('/ratings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => {
      console.error('Failed to create rating:', err.message);
    },
  });
};
