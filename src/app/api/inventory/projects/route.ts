import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProjects, createProject, getProjectStats } from "@/services/inventory-service";
import { projectCreateSchema } from "@/lib/validators/inventory-validation-schema";

// GET /api/inventory/projects - List projects
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    if (searchParams.get("stats") === "true") {
      const stats = await getProjectStats();
      return NextResponse.json(stats);
    }

    const projects = await getProjects({
      status: searchParams.get("status") || undefined,
      city: searchParams.get("city") || undefined,
      search: searchParams.get("search") || undefined,
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/inventory/projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/inventory/projects - Create project
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and MANAGER can create projects
    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = projectCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const project = await createProject(validated.data);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/inventory/projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
