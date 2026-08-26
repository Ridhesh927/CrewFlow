import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executeApiRequest } from "../services/api";
import { toast } from "sonner";

export function useLeaderboard() {
  return useQuery({
    queryKey: ["users", "leaderboard"],
    queryFn: () => executeApiRequest(`/users/leaderboard`),
  });
}

export function useGetAllUsers() {
  return useQuery({
    queryKey: ["users", "all"],
    queryFn: () => executeApiRequest(`/users`),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      executeApiRequest(`/users`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "team"] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      executeApiRequest(`/users/${id}/status`, {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "all"] });
    },
    onError: (err: any) => {
      toast.error("Failed to toggle status", { description: err.message });
      console.error(err);
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      executeApiRequest(`/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "all"] });
    },
    onError: (err: any) => {
      toast.error("Failed to delete user", { description: err.message });
      console.error(err);
    }
  });
}

export function usePromoteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newRole }: { id: number; newRole: string }) =>
      executeApiRequest(`/users/${id}/promote`, {
        method: "PUT",
        body: JSON.stringify({ newRole }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "all"] });
    },
    onError: (err: any) => {
      toast.error("Failed to change role", { description: err.message });
      console.error(err);
    }
  });
}

export function useGetUserById(id: number) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => executeApiRequest(`/users/${id}`),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      executeApiRequest(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      executeApiRequest(`/users/${id}/profile`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
}

export function useBulkUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userIds, department }: { userIds: number[]; department: string }) =>
      executeApiRequest(`/users/bulk-department`, {
        method: "PUT",
        body: JSON.stringify({ userIds, department }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "team"] });
    },
    onError: (err: any) => {
      toast.error("Failed to update departments", { description: err.message });
      console.error(err);
    }
  });
}

export function useBulkUploadUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      executeApiRequest(`/users/bulk-upload`, {
        method: "POST",
        body: formData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Users uploaded successfully");
    },
    onError: (err: any) => {
      toast.error("Bulk upload failed", { description: err.message });
      console.error(err);
    }
  });
}
