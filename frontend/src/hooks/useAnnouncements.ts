import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executeApiRequest } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export const useGetAnnouncements = (requestedAdminScope?: boolean) => {
  const user = useAuthStore((state) => state.user);
  const isActualAdmin = user?.role === 'ADMIN';
  const shouldFetchAll = isActualAdmin && (requestedAdminScope !== undefined ? requestedAdminScope : true);

  return useQuery({
    queryKey: ['announcements', shouldFetchAll ? 'admin-all' : 'targeted', user?.id],
    queryFn: async () => {
      // The endpoint is strictly guarded: only authenticated ADMINs can query /announcements/all
      const endpoint = shouldFetchAll ? '/announcements/all' : '/announcements';
      return executeApiRequest(endpoint);
    },
    enabled: !!user,
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; content: string; targetRole?: string; targetDepartment?: string }) => {
      // Remove empty strings so they are treated as null in backend
      const payload = { ...data };
      if (!payload.targetRole) delete payload.targetRole;
      if (!payload.targetDepartment) delete payload.targetDepartment;
      
      return executeApiRequest('/announcements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return executeApiRequest(`/announcements/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};
