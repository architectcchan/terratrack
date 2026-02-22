import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  notifications,
  tasks,
  samples,
  orders,
  accounts,
  users,
  visits,
} from "@/db/schema";
import { eq, and, lt, lte, gte, inArray, sql, ne, notInArray } from "drizzle-orm";

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const newNotifications: (typeof notifications.$inferInsert)[] = [];

    // ── 1. Overdue tasks ─────────────────────────────────────────────────────
    const overdueTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        assignedTo: tasks.assignedTo,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.orgId, orgId),
          inArray(tasks.status, ["open", "in_progress"]),
          lt(tasks.dueDate, todayStr),
        ),
      );

    for (const task of overdueTasks) {
      const existing = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.orgId, orgId),
            eq(notifications.userId, task.assignedTo),
            eq(notifications.type, "overdue_task"),
            sql`${notifications.link} = ${`/dashboard/tasks?highlight=${task.id}`}`,
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        newNotifications.push({
          orgId,
          userId: task.assignedTo,
          type: "overdue_task",
          title: "Overdue Task",
          message: `"${task.title}" was due on ${task.dueDate} and is still open.`,
          link: `/dashboard/tasks?highlight=${task.id}`,
          isRead: false,
        });
      }
    }

    // ── 2. Samples approaching feedback due date (within 3 days) ─────────────
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split("T")[0];

    const approachingSamples = await db
      .select({
        id: samples.id,
        accountId: samples.accountId,
        accountName: accounts.name,
        feedbackDueDate: samples.feedbackDueDate,
        repId: samples.repId,
      })
      .from(samples)
      .leftJoin(accounts, eq(samples.accountId, accounts.id))
      .where(
        and(
          eq(samples.orgId, orgId),
          inArray(samples.status, ["delivered", "awaiting_feedback"]),
          gte(samples.feedbackDueDate, todayStr),
          lte(samples.feedbackDueDate, threeDaysStr),
        ),
      );

    for (const sample of approachingSamples) {
      const existing = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.orgId, orgId),
            eq(notifications.userId, sample.repId),
            eq(notifications.type, "sample_feedback_due"),
            sql`${notifications.link} = ${`/dashboard/samples/${sample.id}`}`,
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        newNotifications.push({
          orgId,
          userId: sample.repId,
          type: "sample_feedback_due",
          title: "Sample Feedback Due Soon",
          message: `Feedback for sample at ${sample.accountName ?? "account"} is due on ${sample.feedbackDueDate}.`,
          link: `/dashboard/samples/${sample.id}`,
          isRead: false,
        });
      }
    }

    // ── 3. Orders stuck in same stage >7 days ────────────────────────────────
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stuckOrders = await db
      .select({
        id: orders.id,
        accountId: orders.accountId,
        accountName: accounts.name,
        stage: orders.stage,
        repId: orders.repId,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .leftJoin(accounts, eq(orders.accountId, accounts.id))
      .where(
        and(
          eq(orders.orgId, orgId),
          notInArray(orders.stage, ["delivered", "paid", "lost", "cancelled"]),
          lte(orders.updatedAt, sevenDaysAgo),
        ),
      );

    for (const order of stuckOrders) {
      const existing = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.orgId, orgId),
            eq(notifications.userId, order.repId),
            eq(notifications.type, "stuck_order"),
            sql`${notifications.link} = ${`/dashboard/pipeline?order=${order.id}`}`,
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        newNotifications.push({
          orgId,
          userId: order.repId,
          type: "stuck_order",
          title: "Order Stuck in Pipeline",
          message: `Order for ${order.accountName ?? "account"} has been in "${order.stage}" stage for over 7 days.`,
          link: `/dashboard/pipeline?order=${order.id}`,
          isRead: false,
        });
      }
    }

    // ── 4. Accounts with no visit in 30+ days ───────────────────────────────
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dormantAccounts = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        assignedRepId: accounts.assignedRepId,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.orgId, orgId),
          inArray(accounts.status, ["active", "at_risk"]),
          sql`NOT EXISTS (
            SELECT 1 FROM ${visits}
            WHERE ${visits.accountId} = ${accounts.id}
            AND ${visits.checkInTime} >= ${thirtyDaysAgo.toISOString()}
          )`,
        ),
      );

    for (const account of dormantAccounts) {
      if (!account.assignedRepId) continue;

      const existing = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.orgId, orgId),
            eq(notifications.userId, account.assignedRepId),
            eq(notifications.type, "no_recent_visit"),
            sql`${notifications.link} = ${`/dashboard/accounts/${account.id}`}`,
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        newNotifications.push({
          orgId,
          userId: account.assignedRepId,
          type: "no_recent_visit",
          title: "Account Needs a Visit",
          message: `${account.name} hasn't been visited in over 30 days.`,
          link: `/dashboard/accounts/${account.id}`,
          isRead: false,
        });
      }
    }

    if (newNotifications.length > 0) {
      await db.insert(notifications).values(newNotifications);
    }

    return NextResponse.json({
      generated: newNotifications.length,
      breakdown: {
        overdueTasks: overdueTasks.length,
        approachingSamples: approachingSamples.length,
        stuckOrders: stuckOrders.length,
        dormantAccounts: dormantAccounts.length,
      },
    });
  } catch (error) {
    console.error("POST /api/notifications/generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
