import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../services/api";

export function useLeaderboard() {
  return useQuery({
    queryKey: ["users", "leaderboard"],
    queryFn: () => fetchApi(`/users/leaderboard`),
  });
}

export function useCreateIntern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetchApi(`/users/interns`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "team"] });
    },
  });
}
