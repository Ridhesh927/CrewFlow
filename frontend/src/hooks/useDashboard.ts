import { useDashboardMetrics } from './useAnalytics';

export const useDashboard = (userId: any) => {
  const query = useDashboardMetrics(userId);
  return {
    ...query,
    loading: query.isLoading,
  };
};
