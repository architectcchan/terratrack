import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
        status: users.status,
      })
      .from(users)
      .where(eq(users.orgId, session.user.orgId))
      .orderBy(asc(users.firstName), asc(users.lastName));

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error("GET /api/team/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
