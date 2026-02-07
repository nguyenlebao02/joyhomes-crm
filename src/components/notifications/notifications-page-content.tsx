"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

async function fetchNotifications() {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

const typeIcons: Record<string, string> = {
  BOOKING_CREATED: "📋",
  BOOKING_APPROVED: "✅",
  BOOKING_CANCELLED: "❌",
  TASK_ASSIGNED: "📝",
  TASK_DUE: "⏰",
  EVENT_REMINDER: "📅",
  MESSAGE_RECEIVED: "💬",
  CUSTOMER_ASSIGNED: "👤",
  SYSTEM: "🔔",
};

export function NotificationsPageContent() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thông báo</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Tất cả đã đọc"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !notifications?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Không có thông báo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                !notif.read ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""
              }`}
              onClick={() => {
                if (!notif.read) markReadMutation.mutate(notif.id);
              }}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <span className="text-2xl">{typeIcons[notif.type] || "🔔"}</span>
                <div className="flex-1">
                  <p className="font-medium">{notif.title}</p>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
                {!notif.read && (
                  <div className="h-3 w-3 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
