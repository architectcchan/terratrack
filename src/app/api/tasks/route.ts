import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { z } from "zod";

const createTaskSchema = z.object({
  accountId: z.string().uuid().nullish(),
  title: z.string().min(1).max(255),
  description: z.string().nullish(),
  taskType: z
    .enum([
      "follow_up_visit",
      "reorder_check",
      "send_menu",
      "budtender_training",
      "sample_follow_up",
      "vendor_day_prep",
      "manager_assigned",
      "custom",
    ])
    .optional(),
  dueDate: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.string().uuid().nullish(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const data = result.data;
    const orgId = session.user.orgId;

    const [task] = await db
      .insert(tasks)
      .values({
        orgId,
        accountId: data.accountId ?? null,
        assignedTo: data.assignedTo ?? session.user.id,
        createdBy: session.user.id,
        title: data.title,
        description: data.description ?? null,
        taskType: data.taskType ?? "custom",
        dueDate: data.dueDate,
        priority: data.priority ?? "medium",
        status: "open",
      })
      .returning();

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
