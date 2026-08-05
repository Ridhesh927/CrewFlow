import { useQuery } from "@tanstack/react-query";
import { executeApiRequest } from "../services/api";

export function useDashboardMetrics(userId) {
  return useQuery({
    queryKey: ["dashboard", userId],
    queryFn: () => executeApiRequest(`/users/${userId}/dashboard`),
    enabled: !!userId,
  });
}

export function useUserAnalytics(userId) {
  return useQuery({
    queryKey: ["analytics", "user", userId],
    queryFn: () => executeApiRequest(`/analytics/user/${userId}`),
    enabled: !!userId,
  });
}

export function useTeamAnalytics(department = "") {
  return useQuery({
    queryKey: ["analytics", "team", department],
    queryFn: () => executeApiRequest(`/analytics/team${department ? `?department=${department}` : ''}`),
  });
}
