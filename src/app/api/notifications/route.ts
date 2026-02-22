import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "30") || 30));

    const conditions = [
      eq(notifications.userId, session.user.id),
      eq(notifications.orgId, session.user.orgId),
    ];

    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const results = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    const unreadCount = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.orgId, session.user.orgId),
          eq(notifications.isRead, false),
        ),
      );

    return NextResponse.json({
      notifications: results,
      unreadCount: unreadCount.length,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
