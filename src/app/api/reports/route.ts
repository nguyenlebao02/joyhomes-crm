import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-permissions";
import { UserRole } from "@/generated/prisma";
import {
  getDashboardStats,
  getMonthlyRevenue,
  getSalesPerformance,
  getProjectPerformance,
  getBookingStatusBreakdown,
  getCustomerSourceAnalysis,
  getTopPerformers,
  getRevenueByDateRange,
} from "@/services/report-service";

// GET /api/reports
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check reports:read permission
    const role = session.user.role as UserRole;
    if (!hasPermission(role, "reports:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "dashboard";
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const days = parseInt(searchParams.get("days") || "30");

    switch (type) {
      case "dashboard":
        const dashboardStats = await getDashboardStats(undefined, session.user.id, role);
        return NextResponse.json(dashboardStats);

      case "monthly-revenue":
        const monthlyRevenue = await getMonthlyRevenue(year);
        return NextResponse.json(monthlyRevenue);

      case "sales-performance":
        const salesPerformance = await getSalesPerformance();
        return NextResponse.json(salesPerformance);

      case "project-performance":
        const projectPerformance = await getProjectPerformance();
        return NextResponse.json(projectPerformance);

      case "booking-status":
        const bookingStatus = await getBookingStatusBreakdown();
        return NextResponse.json(bookingStatus);

      case "customer-source":
        const customerSource = await getCustomerSourceAnalysis();
        return NextResponse.json(customerSource);

      case "top-performers":
        const topPerformers = await getTopPerformers(5);
        return NextResponse.json(topPerformers);

      case "revenue-trend":
        const revenueTrend = await getRevenueByDateRange(days);
        return NextResponse.json(revenueTrend);

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
