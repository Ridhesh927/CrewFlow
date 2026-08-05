import { useQuery } from '@tanstack/react-query';
import { executeApiRequest } from '../services/api';

export const useGetRatings = () => {
  return useQuery({
    queryKey: ['ratings'],
    queryFn: () => executeApiRequest('/ratings'),
  });
};
