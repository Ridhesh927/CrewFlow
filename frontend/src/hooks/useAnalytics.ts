import { useQuery } from "@tanstack/react-query";
import { executeApiRequest } from "../services/api";

export function useDashboardMetrics(userId: any) {
  return useQuery({
    queryKey: ["dashboard", userId],
    queryFn: () => executeApiRequest(`/users/${userId}/dashboard`),
    enabled: !!userId,
  });
}

export function useUserAnalytics(userId: any) {
  return useQuery({
    queryKey: ["analytics", "user", userId],
    queryFn: () => executeApiRequest(`/analytics/user/${userId}`),
    enabled: !!userId,
  });
}

export function useTeamAnalytics(department: any = "") {
  return useQuery({
    queryKey: ["analytics", "team", department],
    queryFn: () => executeApiRequest(`/analytics/team${department ? `?department=${department}` : ''}`),
  });
}

export function useUserTrends(userId: number) {
  return useQuery({
    queryKey: ["analytics", "trends", userId],
    queryFn: () => executeApiRequest(`/analytics/trends/${userId}`),
    enabled: !!userId,
  });
}
