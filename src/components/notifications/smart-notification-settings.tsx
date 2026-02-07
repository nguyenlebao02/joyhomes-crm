"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Settings, Loader2, RefreshCw, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AutomationSettings {
  noContactDays: number;
  birthdayReminderDays: number;
  bookingFollowupDays: number;
  enabled: boolean;
}

interface AutoNotification {
  type: string;
  priority: string;
  title: string;
  content: string;
  customerName: string;
  customerPhone: string;
  actionSuggestion?: string;
}

interface NotificationsResponse {
  notifications: AutoNotification[];
  total: number;
  settings: AutomationSettings;
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-gray-500",
};

async function fetchSettings(): Promise<AutomationSettings> {
  const res = await fetch("/api/notifications/generate-auto");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await fetch("/api/notifications/generate-auto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ save: false }),
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function updateSettings(settings: Partial<AutomationSettings>): Promise<AutomationSettings> {
  const res = await fetch("/api/notifications/generate-auto", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

export function SmartNotificationSettings() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<AutomationSettings | null>(null);

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["automation-settings"],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const { data: notificationsData, isLoading: loadingNotifications, refetch } = useQuery({
    queryKey: ["auto-notifications"],
    queryFn: fetchNotifications,
    enabled: false,
  });

  const saveMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-settings"] });
      toast.success("Đã lưu cài đặt");
    },
    onError: () => {
      toast.error("Lỗi khi lưu cài đặt");
    },
  });

  const handleSave = () => {
    if (localSettings) {
      saveMutation.mutate(localSettings);
    }
  };

  const currentSettings = localSettings || settings;

  if (loadingSettings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cài đặt thông báo tự động
          </CardTitle>
          <CardDescription>
            Tùy chỉnh quy tắc tạo thông báo nhắc nhở tự động
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Kích hoạt thông báo tự động</Label>
              <p className="text-sm text-muted-foreground">
                Bật/tắt tính năng thông báo tự động
              </p>
            </div>
            <Switch
              checked={currentSettings?.enabled ?? true}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => prev ? { ...prev, enabled: checked } : null)
              }
            />
          </div>

          <Separator />

          {/* No Contact Days */}
          <div className="grid gap-2">
            <Label htmlFor="noContactDays">Nhắc liên hệ sau (ngày)</Label>
            <Input
              id="noContactDays"
              type="number"
              min={1}
              max={30}
              value={currentSettings?.noContactDays ?? 7}
              onChange={(e) =>
                setLocalSettings((prev) =>
                  prev ? { ...prev, noContactDays: parseInt(e.target.value) || 7 } : null
                )
              }
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Tạo nhắc nhở khi khách hàng không được liên hệ sau X ngày
            </p>
          </div>

          {/* Birthday Reminder Days */}
          <div className="grid gap-2">
            <Label htmlFor="birthdayDays">Nhắc sinh nhật trước (ngày)</Label>
            <Input
              id="birthdayDays"
              type="number"
              min={0}
              max={14}
              value={currentSettings?.birthdayReminderDays ?? 3}
              onChange={(e) =>
                setLocalSettings((prev) =>
                  prev ? { ...prev, birthdayReminderDays: parseInt(e.target.value) || 3 } : null
                )
              }
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Nhắc trước ngày sinh nhật khách hàng X ngày
            </p>
          </div>

          {/* Booking Followup Days */}
          <div className="grid gap-2">
            <Label htmlFor="followupDays">Follow-up booking sau (ngày)</Label>
            <Input
              id="followupDays"
              type="number"
              min={1}
              max={14}
              value={currentSettings?.bookingFollowupDays ?? 3}
              onChange={(e) =>
                setLocalSettings((prev) =>
                  prev ? { ...prev, bookingFollowupDays: parseInt(e.target.value) || 3 } : null
                )
              }
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Nhắc follow-up booking đang pending sau X ngày
            </p>
          </div>

          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lưu cài đặt
          </Button>
        </CardContent>
      </Card>

      {/* Preview Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Xem trước thông báo
              </CardTitle>
              <CardDescription>
                Các thông báo sẽ được tạo dựa trên cài đặt hiện tại
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tạo thông báo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingNotifications ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notificationsData?.notifications?.length ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notificationsData.notifications.slice(0, 10).map((notification, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <Badge
                      className={`${priorityColors[notification.priority]} text-white text-xs`}
                    >
                      {notification.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{notification.customerName}</span>
                    <span className="text-muted-foreground">{notification.customerPhone}</span>
                  </div>
                  {notification.actionSuggestion && (
                    <p className="text-xs text-primary mt-2">
                      Gợi ý: {notification.actionSuggestion}
                    </p>
                  )}
                </div>
              ))}
              {notificationsData.total > 10 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Và {notificationsData.total - 10} thông báo khác...
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nhấn "Tạo thông báo" để xem trước các thông báo tự động
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
