import { NotificationHistory } from "@/components/notifications/NotificationHistory";

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
        <p className="text-muted-foreground mt-2">
          View all your notifications, alerts, and system messages in one place.
        </p>
      </div>
      
      <NotificationHistory />
    </div>
  );
}
