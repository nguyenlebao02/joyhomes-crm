import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  generateAutoNotifications,
  saveAutoNotifications,
  getAutomationSettings,
  saveAutomationSettings,
  AutomationSettings,
} from "@/services/notification-automation-service";

// POST - Generate and optionally save auto notifications
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { save = false } = body;

    const settings = await getAutomationSettings(session.user.id);
    const notifications = await generateAutoNotifications(
      session.user.id,
      session.user.role || "SALES",
      settings
    );

    let savedCount = 0;
    if (save && notifications.length > 0) {
      savedCount = await saveAutoNotifications(session.user.id, notifications);
    }

    return NextResponse.json({
      notifications,
      total: notifications.length,
      savedCount,
      settings,
    });
  } catch (error) {
    console.error("Auto notifications API error:", error);
    return NextResponse.json(
      { error: "Failed to generate notifications" },
      { status: 500 }
    );
  }
}

// GET - Get automation settings
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getAutomationSettings(session.user.id);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Get automation settings error:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

// PUT - Update automation settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: Partial<AutomationSettings> = await request.json();
    const updated = await saveAutomationSettings(session.user.id, body);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update automation settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
