"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Plane,
  Shield,
  Scale,
  Landmark,
  Globe,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CrossSellSuggestion {
  type: "TOUR" | "INSURANCE" | "LEGAL" | "FINANCING" | "CITIZENSHIP";
  title: string;
  description: string;
  relevanceScore: number;
}

interface RecommendationsData {
  crossSellSuggestions: CrossSellSuggestion[];
}

const typeIcons: Record<string, typeof Plane> = {
  TOUR: Plane,
  INSURANCE: Shield,
  LEGAL: Scale,
  FINANCING: Landmark,
  CITIZENSHIP: Globe,
};

const typeColors: Record<string, string> = {
  TOUR: "text-blue-500",
  INSURANCE: "text-green-500",
  LEGAL: "text-purple-500",
  FINANCING: "text-amber-500",
  CITIZENSHIP: "text-rose-500",
};

async function fetchRecommendations(customerId: string): Promise<RecommendationsData> {
  const res = await fetch(`/api/recommendations/${customerId}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function CrossSellSuggestions({ customerId }: { customerId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["recommendations", customerId],
    queryFn: () => fetchRecommendations(customerId),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data?.crossSellSuggestions?.length) {
    return null;
  }

  const { crossSellSuggestions } = data;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          Dịch vụ đề xuất
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {crossSellSuggestions.map((suggestion, index) => {
          const Icon = typeIcons[suggestion.type] || Sparkles;
          const colorClass = typeColors[suggestion.type] || "text-gray-500";

          return (
            <div
              key={index}
              className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-sm">{suggestion.title}</p>
                    <Badge
                      variant={suggestion.relevanceScore >= 80 ? "default" : "secondary"}
                      className="text-xs flex-shrink-0"
                    >
                      {suggestion.relevanceScore}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
