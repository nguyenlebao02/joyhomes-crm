import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTasks, createTask, getMyTasks } from "@/services/task-service";
import { taskCreateSchema } from "@/lib/validators/task-event-validation-schema";

// GET /api/tasks
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const myTasks = searchParams.get("my") === "true";
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;

    if (myTasks) {
      const tasks = await getMyTasks(session.user.id);
      return NextResponse.json(tasks);
    }

    const role = session.user.role as string;
    const assigneeId = role === "SALES" ? session.user.id : undefined;

    const tasks = await getTasks({ status, assigneeId, priority });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = taskCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const task = await createTask(validated.data, session.user.id);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
