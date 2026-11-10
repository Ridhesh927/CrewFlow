import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executeApiRequest } from "../services/api";
import { toast } from "sonner";

export type UserRole = "ADMIN" | "SENIOR_TL" | "TL" | "CAPTAIN" | "INTERN";

export interface CreateUserDTO {
  name: string;
  email: string;
  password?: string;
  role: UserRole | string;
  department: string;
  specialId?: string;
  phoneNo?: string;
  managerId?: number | null;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  department?: string;
  specialId?: string;
  phoneNo?: string;
  managerId?: number | null;
  isActive?: boolean;
}

export interface UpdateProfileDTO {
  name?: string;
  phoneNo?: string;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["users", "leaderboard"],
    queryFn: () => executeApiRequest(`/users/leaderboard`),
  });
}

export function useGetAllUsers(params?: { scope?: string } | string) {
  const scope = typeof params === "string" ? params : params?.scope;
  const query = scope ? `?scope=${encodeURIComponent(scope)}` : "";
  return useQuery({
    queryKey: ["users", "all", scope || "default"],
    queryFn: () => executeApiRequest(`/users${query}`),
  });
}

export function useGetMyTeam() {
  return useQuery({
    queryKey: ["users", "my-team"],
    queryFn: () => executeApiRequest(`/users/team`),
  });
}

export function useGetPotentialManagers(enabled = true) {
  return useQuery({
    queryKey: ["users", "managers"],
    queryFn: () => executeApiRequest(`/users/managers`),
    enabled,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDTO) =>
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
    mutationFn: ({ id, newRole }: { id: number; newRole: UserRole }) =>
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
    mutationFn: ({ id, data }: { id: number; data: UpdateUserDTO }) =>
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
    mutationFn: ({ id, data }: { id: number; data: UpdateProfileDTO }) =>
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
