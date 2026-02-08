import { db } from "@/lib/db";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
  subDays,
} from "date-fns";

// Dashboard overview stats with trends
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getDashboardStats(dateRange?: { start: Date; end: Date }) {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    totalCustomers,
    totalProjects,
    totalBookings,
    activeBookings,
    pendingBookings,
    completedBookings,
    totalRevenue,
    totalCommission,
    recentBookings,
    // Trend data - current month
    currentMonthCustomers,
    currentMonthBookings,
    currentMonthRevenue,
    // Trend data - last month
    lastMonthCustomers,
    lastMonthBookings,
    lastMonthRevenue,
  ] = await Promise.all([
    db.customer.count(),
    db.project.count(),
    db.booking.count(),
    db.booking.count({
      where: { status: { in: ["PENDING", "APPROVED", "DEPOSITED", "CONTRACTED"] } },
    }),
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.count({ where: { status: "COMPLETED" } }),
    db.booking.aggregate({
      where: { status: "COMPLETED" },
      _sum: { agreedPrice: true },
    }),
    db.booking.aggregate({
      where: { status: "COMPLETED" },
      _sum: { commissionAmount: true },
    }),
    db.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { fullName: true } },
        property: { select: { code: true, project: { select: { name: true } } } },
      },
    }),
    // Current month customers
    db.customer.count({
      where: { createdAt: { gte: currentMonthStart, lte: currentMonthEnd } },
    }),
    // Current month bookings
    db.booking.count({
      where: { createdAt: { gte: currentMonthStart, lte: currentMonthEnd } },
    }),
    // Current month revenue
    db.booking.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
      },
      _sum: { agreedPrice: true },
    }),
    // Last month customers
    db.customer.count({
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),
    // Last month bookings
    db.booking.count({
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),
    // Last month revenue
    db.booking.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { agreedPrice: true },
    }),
  ]);

  // Calculate trends (percentage change)
  const customerTrend = lastMonthCustomers > 0
    ? ((currentMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100
    : currentMonthCustomers > 0 ? 100 : 0;

  const bookingTrend = lastMonthBookings > 0
    ? ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
    : currentMonthBookings > 0 ? 100 : 0;

  const currentRevenue = Number(currentMonthRevenue._sum.agreedPrice) || 0;
  const lastRevenue = Number(lastMonthRevenue._sum.agreedPrice) || 0;
  const revenueTrend = lastRevenue > 0
    ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
    : currentRevenue > 0 ? 100 : 0;

  // Conversion rate: completed bookings / total customers
  const conversionRate = totalCustomers > 0
    ? (completedBookings / totalCustomers) * 100
    : 0;

  return {
    totalCustomers,
    totalProjects,
    totalBookings,
    activeBookings,
    pendingBookings,
    completedBookings,
    totalRevenue: totalRevenue._sum.agreedPrice || 0,
    totalCommission: totalCommission._sum.commissionAmount || 0,
    recentBookings,
    // Trends
    customerTrend: Math.round(customerTrend * 10) / 10,
    bookingTrend: Math.round(bookingTrend * 10) / 10,
    revenueTrend: Math.round(revenueTrend * 10) / 10,
    conversionRate: Math.round(conversionRate * 10) / 10,
    // Current month stats
    currentMonthCustomers,
    currentMonthBookings,
    currentMonthRevenue: currentRevenue,
  };
}

// Get top performers (sales with most bookings)
export async function getTopPerformers(limit = 5) {
  const salesData = await db.booking.groupBy({
    by: ["userId"],
    where: { status: { not: "CANCELLED" } },
    _count: { id: true },
    _sum: { agreedPrice: true, commissionAmount: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const userIds = salesData.map((s) => s.userId);
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true, email: true, avatar: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return salesData.map((s, index) => ({
    rank: index + 1,
    user: userMap.get(s.userId) || { id: s.userId, fullName: "Unknown", email: "" },
    bookingCount: s._count.id,
    totalRevenue: Number(s._sum.agreedPrice) || 0,
    totalCommission: Number(s._sum.commissionAmount) || 0,
  }));
}

// Get revenue by date range
export async function getRevenueByDateRange(days: number) {
  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subDays(new Date(), days - 1));

  const bookings = await db.booking.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { agreedPrice: true, commissionAmount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const dailyData: Record<string, { date: string; revenue: number; commission: number; count: number }> = {};

  for (let i = 0; i < days; i++) {
    const date = subDays(new Date(), days - 1 - i);
    const dateKey = date.toISOString().split("T")[0];
    dailyData[dateKey] = { date: dateKey, revenue: 0, commission: 0, count: 0 };
  }

  bookings.forEach((b) => {
    const dateKey = new Date(b.createdAt).toISOString().split("T")[0];
    if (dailyData[dateKey]) {
      dailyData[dateKey].revenue += Number(b.agreedPrice) || 0;
      dailyData[dateKey].commission += Number(b.commissionAmount) || 0;
      dailyData[dateKey].count += 1;
    }
  });

  return Object.values(dailyData);
}

// Monthly revenue report
export async function getMonthlyRevenue(year: number) {
  const bookings = await db.booking.findMany({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
    select: { agreedPrice: true, commissionAmount: true, createdAt: true },
  });

  // Group by month
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: 0,
    commission: 0,
    count: 0,
  }));

  bookings.forEach((b) => {
    const month = new Date(b.createdAt).getMonth();
    monthlyData[month].revenue += Number(b.agreedPrice) || 0;
    monthlyData[month].commission += Number(b.commissionAmount) || 0;
    monthlyData[month].count += 1;
  });

  return monthlyData;
}

// Sales performance report
export async function getSalesPerformance(startDate?: Date, endDate?: Date) {
  const where: Record<string, unknown> = {};
  if (startDate && endDate) {
    where.createdAt = { gte: startDate, lte: endDate };
  }

  const salesData = await db.booking.groupBy({
    by: ["userId"],
    where: { ...where, status: { not: "CANCELLED" } },
    _count: { id: true },
    _sum: { agreedPrice: true, commissionAmount: true },
  });

  // Get sales user info
  const userIds = salesData.map((s) => s.userId);
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return salesData.map((s) => ({
    sales: userMap.get(s.userId) || { id: s.userId, fullName: "Unknown" },
    bookingCount: s._count.id,
    totalRevenue: s._sum.agreedPrice || 0,
    totalCommission: s._sum.commissionAmount || 0,
  })).sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue));
}

// Project performance report
export async function getProjectPerformance() {
  const projects = await db.project.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      totalUnits: true,
      availableUnits: true,
      status: true,
      _count: { select: { bookings: true } },
      bookings: {
        where: { status: "COMPLETED" },
        select: { agreedPrice: true },
      },
    },
  });

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    totalUnits: p.totalUnits,
    availableUnits: p.availableUnits,
    soldUnits: p.totalUnits - p.availableUnits,
    soldPercentage: ((p.totalUnits - p.availableUnits) / p.totalUnits) * 100,
    bookingCount: p._count.bookings,
    totalRevenue: p.bookings.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0),
    status: p.status,
  }));
}

// Booking status breakdown
export async function getBookingStatusBreakdown() {
  const statuses = await db.booking.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return statuses.map((s) => ({
    status: s.status,
    count: s._count.id,
  }));
}

// Customer source analysis
export async function getCustomerSourceAnalysis() {
  const sources = await db.customer.groupBy({
    by: ["source"],
    _count: { id: true },
  });

  return sources.map((s) => ({
    source: s.source || "UNKNOWN",
    count: s._count.id,
  }));
}
