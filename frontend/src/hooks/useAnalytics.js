import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../services/api";

export function useDashboardMetrics(userId) {
  return useQuery({
    queryKey: ["dashboard", userId],
    queryFn: () => fetchApi(`/users/${userId}/dashboard`),
    enabled: !!userId,
  });
}

export function useUserAnalytics(userId) {
  return useQuery({
    queryKey: ["analytics", "user", userId],
    queryFn: () => fetchApi(`/analytics/user/${userId}`),
    enabled: !!userId,
  });
}

export function useTeamAnalytics(department = "") {
  return useQuery({
    queryKey: ["analytics", "team", department],
    queryFn: () => fetchApi(`/analytics/team${department ? `?department=${department}` : ''}`),
  });
}
