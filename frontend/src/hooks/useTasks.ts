import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executeApiRequest } from "../services/api";

export function useGetTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: () => executeApiRequest(`/tasks`),
  });
}

export function useGetPendingProofs() {
  return useQuery({
    queryKey: ["tasks", "proofs", "pending"],
    queryFn: () => executeApiRequest(`/tasks/proofs/pending`),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: object) =>
      executeApiRequest(`/tasks`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      console.error("Failed to create task:", err.message);
    },
  });
}

export function useSubmitProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      executeApiRequest(`/tasks/proofs`, {
        method: "POST",
        body: formData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      console.error("Failed to submit proof:", err.message);
    },
  });
}

export function useApproveProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proofId: number) =>
      executeApiRequest(`/tasks/proofs/${proofId}/approve`, {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "proofs", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      console.error("Failed to approve proof:", err.message);
    },
  });
}

export function useRejectProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proofId: number) =>
      executeApiRequest(`/tasks/proofs/${proofId}/reject`, {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "proofs", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      console.error("Failed to reject proof:", err.message);
    },
  });
}
