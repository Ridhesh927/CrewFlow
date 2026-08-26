import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executeApiRequest } from "../services/api";
import { toast } from "sonner";

export function useGetFeedback() {
  return useQuery({
    queryKey: ["feedback"],
    queryFn: () => executeApiRequest(`/feedback`),
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; subject: string; description: string }) =>
      executeApiRequest(`/feedback`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Feedback submitted successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to submit feedback", { description: err.message });
    }
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: string; adminNotes?: string } }) =>
      executeApiRequest(`/feedback/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Feedback status updated");
    },
    onError: (err: any) => {
      toast.error("Failed to update status", { description: err.message });
    }
  });
}
