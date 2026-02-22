import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { tasks, accounts, users } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createTaskSchema } from "@/lib/validations";

const VALID_TYPES = [
  "follow_up_visit",
  "reorder_check",
  "send_menu",
  "budtender_training",
  "sample_follow_up",
  "vendor_day_prep",
  "manager_assigned",
  "custom",
] as const;

const VALID_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const VALID_STATUSES = ["open", "in_progress", "completed", "cancelled"] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId;
    const { searchParams } = new URL(request.url);

    const typeParam = searchParams.get("type") || "";
    const priorityParam = searchParams.get("priority") || "";
    const statusParam = searchParams.get("status") || "";
    const assignedTo = searchParams.get("assigned_to") || "";
    const includeCompleted = searchParams.get("include_completed") === "true";

    const conditions: SQL[] = [eq(tasks.orgId, orgId)];

    if (typeParam) {
      const validTypes = typeParam
        .split(",")
        .filter((t): t is (typeof VALID_TYPES)[number] =>
          (VALID_TYPES as readonly string[]).includes(t),
        );
      if (validTypes.length > 0) conditions.push(inArray(tasks.taskType, validTypes));
    }

    if (priorityParam) {
      const validPriorities = priorityParam
        .split(",")
        .filter((p): p is (typeof VALID_PRIORITIES)[number] =>
          (VALID_PRIORITIES as readonly string[]).includes(p),
        );
      if (validPriorities.length > 0)
        conditions.push(inArray(tasks.priority, validPriorities));
    }

    if (statusParam) {
      const validStatuses = statusParam
        .split(",")
        .filter((s): s is (typeof VALID_STATUSES)[number] =>
          (VALID_STATUSES as readonly string[]).includes(s),
        );
      if (validStatuses.length > 0)
        conditions.push(inArray(tasks.status, validStatuses));
    } else if (!includeCompleted) {
      conditions.push(
        inArray(tasks.status, ["open", "in_progress"]),
      );
    }

    if (assignedTo) {
      conditions.push(eq(tasks.assignedTo, assignedTo));
    }

    const results = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        taskType: tasks.taskType,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        status: tasks.status,
        completedAt: tasks.completedAt,
        accountId: tasks.accountId,
        accountName: accounts.name,
        assignedTo: tasks.assignedTo,
        assigneeFirstName: users.firstName,
        assigneeLastName: users.lastName,
        assigneeAvatarUrl: users.avatarUrl,
        linkedVisitId: tasks.linkedVisitId,
        linkedOrderId: tasks.linkedOrderId,
        linkedSampleId: tasks.linkedSampleId,
        createdBy: tasks.createdBy,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .leftJoin(accounts, eq(tasks.accountId, accounts.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(and(...conditions))
      .orderBy(tasks.dueDate, desc(tasks.createdAt));

    return NextResponse.json({ tasks: results });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const [task] = await db
      .insert(tasks)
      .values({
        orgId: session.user.orgId,
        title: data.title,
        taskType: data.taskType ?? null,
        description: data.description ?? null,
        accountId: data.accountId ?? null,
        assignedTo: data.assignedTo,
        createdBy: session.user.id,
        dueDate: data.dueDate,
        priority: data.priority,
        status: "open",
        linkedVisitId: data.linkedVisitId ?? null,
        linkedOrderId: data.linkedOrderId ?? null,
        linkedSampleId: data.linkedSampleId ?? null,
      })
      .returning();

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
