import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  analyzeCustomerBehavior,
  getPropertyRecommendations,
  getCrossSellSuggestions,
} from "@/services/ai-recommendation-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId } = await params;

    const [behavior, properties, crossSell] = await Promise.all([
      analyzeCustomerBehavior(customerId),
      getPropertyRecommendations(customerId, 5),
      getCrossSellSuggestions(customerId),
    ]);

    return NextResponse.json({
      behavior,
      propertyRecommendations: properties,
      crossSellSuggestions: crossSell,
    });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
