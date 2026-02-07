"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Star, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface PropertyRecommendation {
  property: {
    id: string;
    code: string;
    projectName: string;
    propertyType: string;
    area: number;
    price: number;
    bedrooms: number | null;
    floor: number | null;
    status: string;
  };
  matchScore: number;
  matchReasons: string[];
}

interface CustomerBehavior {
  engagementScore: number;
  engagementLevel: string;
  buyingProbability: number;
  lastContactDaysAgo: number;
  insights: string[];
}

interface RecommendationsData {
  behavior: CustomerBehavior;
  propertyRecommendations: PropertyRecommendation[];
}

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: "Căn hộ",
  VILLA: "Biệt thự",
  TOWNHOUSE: "Nhà phố",
  SHOPHOUSE: "Shophouse",
  LAND: "Đất nền",
  OFFICE: "Văn phòng",
};

const engagementColors: Record<string, string> = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-green-500",
  VERY_HIGH: "bg-blue-500",
};

async function fetchRecommendations(customerId: string): Promise<RecommendationsData> {
  const res = await fetch(`/api/recommendations/${customerId}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function PropertyRecommendations({ customerId }: { customerId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["recommendations", customerId],
    queryFn: () => fetchRecommendations(customerId),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang phân tích...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const { behavior, propertyRecommendations } = data;

  return (
    <div className="space-y-4">
      {/* Customer Analysis Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Phân tích khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Engagement Score */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Điểm tương tác</span>
              <span className="font-medium">{behavior.engagementScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={Math.min(behavior.engagementScore, 100)} className="h-2" />
              <Badge variant="secondary" className={`${engagementColors[behavior.engagementLevel]} text-white text-xs`}>
                {behavior.engagementLevel}
              </Badge>
            </div>
          </div>

          {/* Buying Probability */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Khả năng mua</span>
              <span className="font-medium">{behavior.buyingProbability}%</span>
            </div>
            <Progress
              value={behavior.buyingProbability}
              className="h-2"
            />
          </div>

          {/* Insights */}
          {behavior.insights.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Gợi ý:</p>
              <ul className="space-y-1">
                {behavior.insights.map((insight, i) => (
                  <li key={i} className="text-xs text-amber-600 flex items-start gap-1">
                    <Star className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Recommendations */}
      {propertyRecommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              BDS phù hợp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {propertyRecommendations.map((rec) => (
              <div
                key={rec.property.id}
                className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-sm">{rec.property.code}</p>
                    <p className="text-xs text-muted-foreground">{rec.property.projectName}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {rec.matchScore}% match
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground mb-2">
                  <span>{propertyTypeLabels[rec.property.propertyType] || rec.property.propertyType}</span>
                  <span>-</span>
                  <span>{rec.property.area}m²</span>
                  {rec.property.bedrooms && (
                    <>
                      <span>-</span>
                      <span>{rec.property.bedrooms} PN</span>
                    </>
                  )}
                </div>
                <p className="font-semibold text-sm text-primary">
                  {formatCurrency(rec.property.price)}
                </p>
                {rec.matchReasons.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rec.matchReasons.map((reason, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
