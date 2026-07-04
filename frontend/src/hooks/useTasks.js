import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../services/api";

export function useActiveTasks() {
  return useQuery({
    queryKey: ["tasks", "active"],
    queryFn: () => fetchApi(`/tasks`),
    // Note: If you don't have a GET /tasks endpoint in the backend, you might need to rely on the dashboard endpoint for tasks.
  });
}

export function useApproveProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proofId) =>
      fetchApi(`/tasks/proofs/${proofId}/approve`, {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSubmitProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetchApi(`/tasks/proofs`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
