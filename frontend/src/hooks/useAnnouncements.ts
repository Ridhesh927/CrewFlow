import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useGetAnnouncements = (isAdmin: boolean = false) => {
  return useQuery({
    queryKey: ['announcements', isAdmin],
    queryFn: async () => {
      // Admins get ALL announcements, others get targeted announcements
      const endpoint = isAdmin ? '/announcements/all' : '/announcements';
      const response = await api.get(endpoint);
      return response.data;
    },
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
      
      const response = await api.post('/announcements', payload);
      return response.data;
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
      const response = await api.delete(`/announcements/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};
