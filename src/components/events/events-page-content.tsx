"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, CalendarDays, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Event {
  id: string;
  title: string;
  description?: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string;
  project?: { id: string; name: string; code: string };
  _count: { attendees: number };
}

async function fetchEvents(type?: string) {
  const params = new URLSearchParams();
  if (type && type !== "all") params.set("type", type);
  const res = await fetch(`/api/events?${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

const typeLabels: Record<string, string> = {
  MEETING: "Họp",
  SITE_VISIT: "Khảo sát",
  OPEN_HOUSE: "Mở bán",
  TRAINING: "Đào tạo",
  OTHER: "Khác",
};

const typeColors: Record<string, string> = {
  MEETING: "bg-blue-100 text-blue-800",
  SITE_VISIT: "bg-green-100 text-green-800",
  OPEN_HOUSE: "bg-purple-100 text-purple-800",
  TRAINING: "bg-orange-100 text-orange-800",
  OTHER: "bg-gray-100 text-gray-800",
};

export function EventsPageContent() {
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["events", typeFilter],
    queryFn: () => fetchEvents(typeFilter),
  });

  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register" }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      return res.json();
    },
    onSuccess: () => toast.success("Đăng ký thành công"),
    onError: (error: Error) => toast.error(error.message),
  });

  const upcomingEvents = events?.filter((e) => new Date(e.startTime) >= new Date()) || [];
  const pastEvents = events?.filter((e) => new Date(e.startTime) < new Date()) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sự kiện</h1>
          <p className="text-muted-foreground">Lịch sự kiện và hoạt động</p>
        </div>
        <Link href="/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo sự kiện
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Loại sự kiện" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="MEETING">Họp</SelectItem>
            <SelectItem value="SITE_VISIT">Khảo sát</SelectItem>
            <SelectItem value="OPEN_HOUSE">Mở bán</SelectItem>
            <SelectItem value="TRAINING">Đào tạo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !events?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Chưa có sự kiện nào</p>
            <Link href="/events/new">
              <Button className="mt-4">Tạo sự kiện đầu tiên</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcomingEvents.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Sắp diễn ra ({upcomingEvents.length})</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRegister={() => registerMutation.mutate(event.id)}
                    isRegistering={registerMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {pastEvents.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 text-muted-foreground">
                Đã qua ({pastEvents.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 opacity-60">
                {pastEvents.slice(0, 4).map((event) => (
                  <EventCard key={event.id} event={event} isPast />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  onRegister,
  isRegistering,
  isPast,
}: {
  event: Event;
  onRegister?: () => void;
  isRegistering?: boolean;
  isPast?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <Link href={`/events/${event.id}`}>
              <CardTitle className="text-lg hover:underline">{event.title}</CardTitle>
            </Link>
            <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs ${typeColors[event.type]}`}>
              {typeLabels[event.type]}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>
            {format(new Date(event.startTime), "dd/MM/yyyy HH:mm", { locale: vi })}
            {" - "}
            {format(new Date(event.endTime), "HH:mm", { locale: vi })}
          </span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{event._count.attendees} người tham gia</span>
        </div>
        {event.project && (
          <p className="text-xs text-blue-600">
            🏠 {event.project.name}
          </p>
        )}
        {!isPast && onRegister && (
          <Button size="sm" className="mt-2" onClick={onRegister} disabled={isRegistering}>
            Đăng ký tham gia
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
