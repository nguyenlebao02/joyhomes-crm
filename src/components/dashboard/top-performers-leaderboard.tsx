"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Award } from "lucide-react";
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
  if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)} ty`;
  if (price >= 1000000) return `${(price / 1000000).toFixed(0)} trieu`;
  return price.toLocaleString("vi-VN");
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  }
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
            <Trophy className="h-5 w-5" />
            Top Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Chua co du lieu
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Sales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((performer) => (
            <div
              key={performer.user.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
            >
              <div className="w-8 flex justify-center">{getRankIcon(performer.rank)}</div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={performer.user.avatar} />
                <AvatarFallback>{getInitials(performer.user.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{performer.user.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {performer.bookingCount} booking
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">
                  {formatPrice(performer.totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  HH: {formatPrice(performer.totalCommission)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
