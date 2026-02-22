import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.orgId, session.user.orgId),
          eq(notifications.isRead, false),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/notifications/mark-all-read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
