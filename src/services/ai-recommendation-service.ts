import db from "@/lib/db";
import type { PropertyType } from "@/generated/prisma";
import { Prisma } from "@/generated/prisma";

// Customer engagement score weights
const ENGAGEMENT_WEIGHTS = {
  contact: 5,
  booking: 20,
  siteVisit: 15,
  interest: 10,
  note: 3,
  reminder: 2,
};

// Customer behavior analysis result
export interface CustomerBehaviorAnalysis {
  customerId: string;
  engagementScore: number;
  engagementLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  buyingProbability: number;
  preferredPropertyTypes: string[];
  budgetRange: { min: number; max: number } | null;
  preferredProjects: string[];
  lastContactDaysAgo: number;
  contactFrequency: number;
  insights: string[];
}

// Property recommendation
export interface PropertyRecommendation {
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

// Cross-sell suggestion
export interface CrossSellSuggestion {
  type: "TOUR" | "INSURANCE" | "LEGAL" | "FINANCING" | "CITIZENSHIP";
  title: string;
  description: string;
  relevanceScore: number;
}

/**
 * Analyze customer behavior and calculate engagement metrics
 */
export async function analyzeCustomerBehavior(customerId: string): Promise<CustomerBehaviorAnalysis> {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: {
      contacts: { orderBy: { createdAt: "desc" } },
      bookings: { include: { property: true, project: true } },
      interests: { include: { project: true } },
      notes: true,
      reminders: true,
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  // Calculate engagement score
  const contactScore = customer.contacts.length * ENGAGEMENT_WEIGHTS.contact;
  const bookingScore = customer.bookings.length * ENGAGEMENT_WEIGHTS.booking;
  const siteVisitScore = customer.contacts.filter((c) => c.type === "SITE_VISIT").length * ENGAGEMENT_WEIGHTS.siteVisit;
  const interestScore = customer.interests.length * ENGAGEMENT_WEIGHTS.interest;
  const noteScore = customer.notes.length * ENGAGEMENT_WEIGHTS.note;
  const reminderScore = customer.reminders.length * ENGAGEMENT_WEIGHTS.reminder;

  const engagementScore = contactScore + bookingScore + siteVisitScore + interestScore + noteScore + reminderScore;

  // Determine engagement level
  let engagementLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" = "LOW";
  if (engagementScore >= 100) engagementLevel = "VERY_HIGH";
  else if (engagementScore >= 50) engagementLevel = "HIGH";
  else if (engagementScore >= 20) engagementLevel = "MEDIUM";

  // Calculate buying probability based on status and behavior
  let buyingProbability = 0;
  switch (customer.status) {
    case "WON": buyingProbability = 100; break;
    case "NEGOTIATING": buyingProbability = 70; break;
    case "QUALIFIED": buyingProbability = 50; break;
    case "CONTACTED": buyingProbability = 30; break;
    case "NEW": buyingProbability = 15; break;
    case "DORMANT": buyingProbability = 5; break;
    case "LOST": buyingProbability = 0; break;
  }

  // Adjust probability based on engagement
  if (engagementLevel === "VERY_HIGH") buyingProbability = Math.min(buyingProbability + 15, 100);
  else if (engagementLevel === "HIGH") buyingProbability = Math.min(buyingProbability + 10, 100);

  // Extract preferred property types from interests and bookings
  const propertyTypes = new Set<string>();
  customer.interests.forEach((i) => {
    if (i.propertyType) propertyTypes.add(i.propertyType);
  });
  customer.bookings.forEach((b) => {
    if (b.property?.propertyType) propertyTypes.add(b.property.propertyType);
  });

  // Extract budget range
  let budgetRange: { min: number; max: number } | null = null;
  const budgets: number[] = [];
  customer.interests.forEach((i) => {
    if (i.budget) {
      const parsed = parseBudgetString(i.budget);
      if (parsed) budgets.push(parsed);
    }
  });
  customer.bookings.forEach((b) => {
    budgets.push(Number(b.agreedPrice));
  });
  if (budgets.length > 0) {
    budgetRange = {
      min: Math.min(...budgets) * 0.8,
      max: Math.max(...budgets) * 1.2,
    };
  }

  // Extract preferred projects
  const projectIds = new Set<string>();
  customer.interests.forEach((i) => projectIds.add(i.projectId));
  customer.bookings.forEach((b) => projectIds.add(b.projectId));

  // Calculate last contact days ago
  const lastContact = customer.contacts[0];
  const lastContactDaysAgo = lastContact
    ? Math.floor((Date.now() - new Date(lastContact.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Calculate contact frequency (contacts per month since creation)
  const monthsSinceCreation = Math.max(1, (Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
  const contactFrequency = customer.contacts.length / monthsSinceCreation;

  // Generate insights
  const insights: string[] = [];
  if (lastContactDaysAgo > 14) {
    insights.push(`Khách hàng chưa được liên hệ trong ${lastContactDaysAgo} ngày`);
  }
  if (customer.status === "NEGOTIATING" && customer.bookings.length === 0) {
    insights.push("Đang đàm phán nhưng chưa có booking - cần đẩy mạnh chốt đơn");
  }
  if (engagementLevel === "VERY_HIGH" && customer.status === "CONTACTED") {
    insights.push("Engagement cao nhưng status thấp - cần qualify khách hàng");
  }
  if (customer.interests.length > 0 && customer.bookings.length === 0) {
    insights.push("Có quan tâm dự án nhưng chưa booking - cần tư vấn thêm");
  }
  if (contactFrequency < 0.5 && customer.status !== "WON" && customer.status !== "LOST") {
    insights.push("Tần suất liên hệ thấp - cần tăng cường chăm sóc");
  }

  return {
    customerId,
    engagementScore: Math.round(engagementScore),
    engagementLevel,
    buyingProbability: Math.round(buyingProbability),
    preferredPropertyTypes: Array.from(propertyTypes),
    budgetRange,
    preferredProjects: Array.from(projectIds),
    lastContactDaysAgo,
    contactFrequency: Math.round(contactFrequency * 10) / 10,
    insights,
  };
}

/**
 * Get property recommendations for a customer
 */
export async function getPropertyRecommendations(
  customerId: string,
  limit = 5
): Promise<PropertyRecommendation[]> {
  const analysis = await analyzeCustomerBehavior(customerId);

  // Build query for available properties
  const where: Prisma.PropertyWhereInput = {
    status: "AVAILABLE",
  };

  // Filter by preferred property types if any
  if (analysis.preferredPropertyTypes.length > 0) {
    where.propertyType = { in: analysis.preferredPropertyTypes as PropertyType[] };
  }

  // Filter by budget range if available
  if (analysis.budgetRange) {
    where.price = {
      gte: analysis.budgetRange.min,
      lte: analysis.budgetRange.max,
    };
  }

  const properties = await db.property.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, code: true } },
    },
    take: limit * 3, // Get more to score and filter
  });

  // Score each property
  const scored = properties.map((property) => {
    let matchScore = 50; // Base score
    const matchReasons: string[] = [];

    // Preferred project match (+30)
    if (analysis.preferredProjects.includes(property.projectId)) {
      matchScore += 30;
      matchReasons.push("Dự án khách quan tâm");
    }

    // Property type match (+20)
    if (analysis.preferredPropertyTypes.includes(property.propertyType)) {
      matchScore += 20;
      matchReasons.push("Loại BĐS phù hợp");
    }

    // Budget match (+25)
    if (analysis.budgetRange) {
      const price = Number(property.price);
      if (price >= analysis.budgetRange.min && price <= analysis.budgetRange.max) {
        matchScore += 25;
        matchReasons.push("Trong tầm ngân sách");
      }
    }

    // Random slight variation for diversity
    matchScore += Math.random() * 5;

    return {
      property: {
        id: property.id,
        code: property.code,
        projectName: property.project.name,
        propertyType: property.propertyType,
        area: Number(property.area),
        price: Number(property.price),
        bedrooms: property.bedrooms,
        floor: property.floor,
        status: property.status,
      },
      matchScore: Math.min(100, Math.round(matchScore)),
      matchReasons,
    };
  });

  // Sort by score and return top results
  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Get similar properties to a given property
 */
export async function getSimilarProperties(propertyId: string, limit = 5): Promise<PropertyRecommendation[]> {
  const property = await db.property.findUnique({
    where: { id: propertyId },
    include: { project: true },
  });

  if (!property) return [];

  const price = Number(property.price);
  const area = Number(property.area);

  const similar = await db.property.findMany({
    where: {
      id: { not: propertyId },
      status: "AVAILABLE",
      OR: [
        { projectId: property.projectId },
        { propertyType: property.propertyType },
        {
          price: { gte: price * 0.8, lte: price * 1.2 },
        },
      ],
    },
    include: {
      project: { select: { id: true, name: true, code: true } },
    },
    take: limit * 2,
  });

  return similar.map((p) => {
    const matchReasons: string[] = [];
    let matchScore = 50;

    if (p.projectId === property.projectId) {
      matchScore += 30;
      matchReasons.push("Cùng dự án");
    }
    if (p.propertyType === property.propertyType) {
      matchScore += 20;
      matchReasons.push("Cùng loại BĐS");
    }

    const pPrice = Number(p.price);
    if (Math.abs(pPrice - price) / price < 0.1) {
      matchScore += 15;
      matchReasons.push("Giá tương đương");
    }

    const pArea = Number(p.area);
    if (Math.abs(pArea - area) / area < 0.15) {
      matchScore += 10;
      matchReasons.push("Diện tích tương đương");
    }

    return {
      property: {
        id: p.id,
        code: p.code,
        projectName: p.project.name,
        propertyType: p.propertyType,
        area: Number(p.area),
        price: Number(p.price),
        bedrooms: p.bedrooms,
        floor: p.floor,
        status: p.status,
      },
      matchScore: Math.min(100, matchScore),
      matchReasons,
    };
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

/**
 * Get cross-sell suggestions for a customer
 */
export async function getCrossSellSuggestions(customerId: string): Promise<CrossSellSuggestion[]> {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: {
      bookings: { include: { project: true } },
      interests: { include: { project: true } },
    },
  });

  if (!customer) return [];

  const suggestions: CrossSellSuggestion[] = [];

  // Has active booking or strong interest
  const hasActiveBooking = customer.bookings.some(
    (b) => ["PENDING", "APPROVED", "DEPOSITED", "CONTRACTED"].includes(b.status)
  );
  const hasInterests = customer.interests.length > 0;

  if (hasActiveBooking || hasInterests) {
    // Tour suggestion
    suggestions.push({
      type: "TOUR",
      title: "Tour tham quan dự án",
      description: "Đặt lịch tour tham quan thực tế dự án để trải nghiệm không gian sống",
      relevanceScore: hasActiveBooking ? 95 : 80,
    });

    // Legal consulting
    suggestions.push({
      type: "LEGAL",
      title: "Tư vấn pháp lý",
      description: "Dịch vụ tư vấn pháp lý giao dịch BĐS, hợp đồng mua bán",
      relevanceScore: hasActiveBooking ? 90 : 60,
    });

    // Financing
    suggestions.push({
      type: "FINANCING",
      title: "Hỗ trợ tài chính",
      description: "Kết nối ngân hàng đối tác với lãi suất ưu đãi, hỗ trợ vay tới 70%",
      relevanceScore: hasActiveBooking ? 85 : 70,
    });
  }

  // Insurance (for completed bookings)
  const hasCompletedBooking = customer.bookings.some((b) => b.status === "COMPLETED");
  if (hasCompletedBooking) {
    suggestions.push({
      type: "INSURANCE",
      title: "Bảo hiểm BĐS",
      description: "Bảo hiểm tài sản, bảo hiểm cháy nổ cho căn hộ/nhà ở",
      relevanceScore: 85,
    });
  }

  // Citizenship program (for high-value customers)
  const totalValue = customer.bookings.reduce((sum, b) => sum + Number(b.agreedPrice), 0);
  if (totalValue > 5000000000 || customer.income === "HIGH") { // > 5 tỷ VND
    suggestions.push({
      type: "CITIZENSHIP",
      title: "Chương trình Golden Visa",
      description: "Tư vấn chương trình định cư, quốc tịch thông qua đầu tư BĐS",
      relevanceScore: 75,
    });
  }

  return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Get customers needing attention (no contact in X days).
 * Filters at DB level to avoid loading all customers into memory.
 */
export async function getCustomersNeedingAttention(
  userId: string,
  role: string,
  daysThreshold = 7,
  limit = 20
): Promise<Array<{ customer: { id: string; fullName: string; phone: string; status: string }; daysSinceContact: number; reason: string }>> {
  const thresholdDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);

  const where: Prisma.CustomerWhereInput = {
    deletedAt: null,
    status: { notIn: ["WON", "LOST"] },
    // Only customers with no contacts OR last contact older than threshold
    OR: [
      { contacts: { none: {} } },
      { contacts: { every: { createdAt: { lt: thresholdDate } } } },
    ],
  };

  if (role === "SALES") {
    where.userId = userId;
  }

  const customers = await db.customer.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      phone: true,
      status: true,
      createdAt: true,
      contacts: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  return customers.map((c) => {
    const lastContactDate = c.contacts[0] ? new Date(c.contacts[0].createdAt) : new Date(c.createdAt);
    const daysSinceContact = Math.floor((Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      customer: { id: c.id, fullName: c.fullName, phone: c.phone, status: c.status },
      daysSinceContact,
      reason: !c.contacts[0] ? "Chưa có lịch sử liên hệ" : `Không liên hệ ${daysSinceContact} ngày`,
    };
  }).sort((a, b) => b.daysSinceContact - a.daysSinceContact);
}

// Helper function to parse budget string to number
function parseBudgetString(budget: string): number | null {
  const cleaned = budget.toLowerCase().replace(/[,.\s]/g, "");
  const match = cleaned.match(/(\d+)(ty|tỷ|trieu|triệu)?/);
  if (!match) return null;

  let value = parseInt(match[1], 10);
  const unit = match[2];

  if (unit === "ty" || unit === "tỷ") {
    value *= 1000000000;
  } else if (unit === "trieu" || unit === "triệu") {
    value *= 1000000;
  }

  return value;
}
