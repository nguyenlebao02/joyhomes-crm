"use client";

import { useMemo } from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  iconColor?: string;
  valueColor?: string;
  accentColor?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  iconColor = "text-primary",
  valueColor,
  accentColor = "border-l-primary",
}: KpiCardProps) {
  const TrendIcon = useMemo(() => {
    if (trend === undefined || trend === 0) return Minus;
    return trend > 0 ? TrendingUp : TrendingDown;
  }, [trend]);

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "text-muted-foreground";
    return trend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
  };

  const getTrendBg = () => {
    if (trend === undefined || trend === 0) return "bg-muted";
    return trend > 0
      ? "bg-emerald-50 dark:bg-emerald-950/40"
      : "bg-red-50 dark:bg-red-950/40";
  };

  // Derive icon background from accentColor
  const iconBgMap: Record<string, string> = {
    "border-l-emerald-500": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
    "border-l-primary": "bg-primary/10 text-primary",
    "border-l-amber-500": "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    "border-l-violet-500": "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400",
  };
  const iconBg = iconBgMap[accentColor] || "bg-primary/10 text-primary";

  return (
    <Card className={`border-l-4 ${accentColor} transition-shadow hover:shadow-md`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold tracking-tight ${valueColor || ""}`}>
              {value}
            </p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
        {(subtitle || trend !== undefined) && (
          <div className="mt-3 flex items-center gap-2">
            {trend !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${getTrendBg()} ${getTrendColor()}`}
              >
                <TrendIcon className="h-3 w-3" />
                {Math.abs(trend)}%
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
