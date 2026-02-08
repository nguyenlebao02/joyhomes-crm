"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface TopPerformer {
  rank: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  bookingCount: number;
  totalRevenue: number;
  totalCommission: number;
}

async function fetchTopPerformers() {
  const res = await fetch("/api/reports?type=top-performers");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function formatPrice(price: number): string {
  if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)} tỷ`;
  if (price >= 1000000) return `${(price / 1000000).toFixed(0)} triệu`;
  return price.toLocaleString("vi-VN");
}

const RANK_STYLES: Record<number, { badge: string; ring: string }> = {
  1: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    ring: "ring-2 ring-amber-400",
  },
  2: {
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    ring: "ring-2 ring-gray-300 dark:ring-gray-500",
  },
  3: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    ring: "ring-2 ring-orange-400",
  },
};

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank];
  if (style) {
    return (
      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${style.badge}`}>
        {rank}
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {rank}
    </span>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TopPerformersLeaderboard() {
  const { data, isLoading } = useQuery<TopPerformer[]>({
    queryKey: ["top-performers"],
    queryFn: fetchTopPerformers,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Bảng xếp hạng Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Chưa có dữ liệu
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = Math.max(...data.map((p) => p.totalRevenue));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Bảng xếp hạng Sales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((performer) => {
            const pct = maxRevenue > 0 ? (performer.totalRevenue / maxRevenue) * 100 : 0;
            const ringClass = RANK_STYLES[performer.rank]?.ring || "";

            return (
              <div
                key={performer.user.id}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
              >
                <RankBadge rank={performer.rank} />
                <Avatar className={`h-9 w-9 ${ringClass}`}>
                  <AvatarImage src={performer.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {getInitials(performer.user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{performer.user.fullName}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {performer.bookingCount} booking
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(performer.totalRevenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    HH: {formatPrice(performer.totalCommission)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
