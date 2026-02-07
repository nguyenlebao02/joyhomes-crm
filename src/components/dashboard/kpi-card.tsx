"use client";

import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  iconColor?: string;
  valueColor?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  iconColor = "text-muted-foreground",
  valueColor,
}: KpiCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return Minus;
    return trend > 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "text-muted-foreground";
    return trend > 0 ? "text-green-600" : "text-red-600";
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor || ""}`}>{value}</div>
        {(subtitle || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <span className={`flex items-center text-xs ${getTrendColor()}`}>
                <TrendIcon className="h-3 w-3 mr-0.5" />
                {Math.abs(trend)}%
              </span>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trendLabel && (
              <p className="text-xs text-muted-foreground">{trendLabel}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
