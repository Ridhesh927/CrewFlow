"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Check, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationHistory() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (!notifications) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center p-12 text-muted-foreground border rounded-lg bg-card">
        You have no notifications yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Notification History</h2>
          <p className="text-sm text-muted-foreground">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="flex items-center gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-colors ${
              !notif.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'
            }`}
          >
            <div className="mb-3 sm:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  notif.type === 'SUCCESS' ? 'text-green-500' :
                  notif.type === 'WARNING' ? 'text-orange-500' : 'text-blue-500'
                }`}>
                  {notif.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className={`text-sm ${!notif.isRead ? 'font-medium' : 'text-muted-foreground'}`}>
                {notif.message}
              </p>
            </div>
            
            {!notif.isRead && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => markAsRead(notif.id)}
                className="self-start sm:self-auto text-muted-foreground hover:text-primary"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark read
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
