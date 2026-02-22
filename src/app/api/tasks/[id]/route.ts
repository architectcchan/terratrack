import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateTaskSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const data = result.data;

    const [existing] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.orgId, session.user.orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateValues.title = data.title;
    if (data.taskType !== undefined) updateValues.taskType = data.taskType;
    if (data.description !== undefined) updateValues.description = data.description;
    if (data.accountId !== undefined) updateValues.accountId = data.accountId;
    if (data.assignedTo !== undefined) updateValues.assignedTo = data.assignedTo;
    if (data.dueDate !== undefined) updateValues.dueDate = data.dueDate;
    if (data.priority !== undefined) updateValues.priority = data.priority;
    if (data.linkedVisitId !== undefined) updateValues.linkedVisitId = data.linkedVisitId;
    if (data.linkedOrderId !== undefined) updateValues.linkedOrderId = data.linkedOrderId;
    if (data.linkedSampleId !== undefined) updateValues.linkedSampleId = data.linkedSampleId;

    if (data.status !== undefined) {
      updateValues.status = data.status;
      if (data.status === "completed") {
        updateValues.completedAt = new Date();
      } else {
        updateValues.completedAt = null;
      }
    }

    const [updated] = await db
      .update(tasks)
      .set(updateValues)
      .where(and(eq(tasks.id, id), eq(tasks.orgId, session.user.orgId)))
      .returning();

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.orgId, session.user.orgId)))
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
