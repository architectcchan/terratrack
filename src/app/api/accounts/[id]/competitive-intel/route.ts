import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orgId = session.user.orgId;

    const result = await db.execute(sql`
      SELECT
        brand_name,
        COUNT(*)::int AS times_noted,
        MAX(check_in_time) AS last_seen
      FROM visits,
           UNNEST(competitor_brands_noted) AS brand_name
      WHERE account_id = ${id}
        AND org_id = ${orgId}
        AND competitor_brands_noted IS NOT NULL
        AND brand_name IS NOT NULL
        AND brand_name <> ''
      GROUP BY brand_name
      ORDER BY times_noted DESC, brand_name ASC
    `);

    return NextResponse.json({ brands: result.rows });
  } catch (error) {
    console.error("GET /api/accounts/[id]/competitive-intel error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
