import { useQuery } from '@tanstack/react-query';
import { executeApiRequest } from '../services/api';

export const useGetAttendances = () => {
  return useQuery({
    queryKey: ['attendances'],
    queryFn: () => executeApiRequest('/attendances'),
  });
};
