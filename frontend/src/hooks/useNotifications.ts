import { useState, useEffect, useCallback } from 'react';
import { executeApiRequest } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

export interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      const data = await executeApiRequest('/notifications');
      if (data && data.success) {
        setNotifications(data.notifications || []);
      } else {
        throw new Error(data?.message || 'Failed to fetch notifications');
      }
    } catch (err: any) {
      setIsError(true);
      setError(err?.message || 'Failed to fetch notifications');
      console.error("Failed to fetch notifications", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    // Optional: poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    if (pendingIds.includes(id)) return;
    setPendingIds((prev) => [...prev, id]);
    const prevNotifications = [...notifications];
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await executeApiRequest(`/notifications/${id}/read`, { method: 'PUT' });
    } catch (error: any) {
      setNotifications(prevNotifications);
      toast.error(error.message || 'Failed to mark notification as read');
      console.error('Failed to mark as read', error);
    } finally {
      setPendingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const markAllAsRead = async () => {
    if (isMarkingAllRead) return;
    setIsMarkingAllRead(true);
    const prevNotifications = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await executeApiRequest(`/notifications/read-all`, { method: 'PUT' });
    } catch (error: any) {
      setNotifications(prevNotifications);
      toast.error(error.message || 'Failed to mark all notifications as read');
      console.error('Failed to mark all as read', error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
    refetch: fetchNotifications,
    isLoading,
    isError,
    error,
    isMarkingAllAsRead: isMarkingAllRead,
    pendingNotificationIds: pendingIds,
    isMarkingReadId: (id: number) => pendingIds.includes(id),
  };
}
