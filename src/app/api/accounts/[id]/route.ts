import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { accounts, users, accountChains } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

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

    const [account] = await db
      .select({
        id: accounts.id,
        orgId: accounts.orgId,
        name: accounts.name,
        dbaName: accounts.dbaName,
        addressLine1: accounts.addressLine1,
        addressLine2: accounts.addressLine2,
        city: accounts.city,
        state: accounts.state,
        zip: accounts.zip,
        latitude: accounts.latitude,
        longitude: accounts.longitude,
        phone: accounts.phone,
        email: accounts.email,
        website: accounts.website,
        licenseNumber: accounts.licenseNumber,
        licenseType: accounts.licenseType,
        licenseExpiration: accounts.licenseExpiration,
        status: accounts.status,
        revenueTier: accounts.revenueTier,
        chainId: accounts.chainId,
        chainName: accountChains.name,
        chainStoreCount: accountChains.storeCount,
        assignedRepId: accounts.assignedRepId,
        repFirstName: users.firstName,
        repLastName: users.lastName,
        repAvatarUrl: users.avatarUrl,
        paymentTerms: accounts.paymentTerms,
        notes: accounts.notes,
        tags: accounts.tags,
        googlePlaceId: accounts.googlePlaceId,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
        totalRevenue: sql<string>`COALESCE((
          SELECT SUM(o.total)::text
          FROM orders o
          WHERE o.account_id = ${accounts.id}
            AND o.org_id = ${orgId}
            AND o.payment_status = 'paid'
        ), '0')`,
        ordersThisMonth: sql<number>`(
          SELECT COUNT(*)::int
          FROM orders o
          WHERE o.account_id = ${accounts.id}
            AND o.org_id = ${orgId}
            AND o.created_at >= date_trunc('month', now())
        )`,
        totalVisits: sql<number>`(
          SELECT COUNT(*)::int
          FROM visits v
          WHERE v.account_id = ${accounts.id}
            AND v.org_id = ${orgId}
        )`,
        lastVisitDate: sql<string | null>`(
          SELECT MAX(v.check_in_time)::text
          FROM visits v
          WHERE v.account_id = ${accounts.id}
            AND v.org_id = ${orgId}
        )`,
        lastOrderDate: sql<string | null>`(
          SELECT MAX(o.created_at)::text
          FROM orders o
          WHERE o.account_id = ${accounts.id}
            AND o.org_id = ${orgId}
        )`,
        avgOrderValue: sql<string>`COALESCE((
          SELECT AVG(o.total)::text
          FROM orders o
          WHERE o.account_id = ${accounts.id}
            AND o.org_id = ${orgId}
            AND o.stage NOT IN ('lost', 'cancelled')
        ), '0')`,
        totalOrders: sql<number>`(
          SELECT COUNT(*)::int
          FROM orders o
          WHERE o.account_id = ${accounts.id}
            AND o.org_id = ${orgId}
        )`,
      })
      .from(accounts)
      .leftJoin(users, eq(accounts.assignedRepId, users.id))
      .leftJoin(accountChains, eq(accounts.chainId, accountChains.id))
      .where(and(eq(accounts.id, id), eq(accounts.orgId, orgId)));

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("GET /api/accounts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
    const orgId = session.user.orgId;
    const body = await request.json();

    const PATCHABLE = [
      "status",
      "revenueTier",
      "assignedRepId",
      "notes",
      "paymentTerms",
      "phone",
      "email",
      "website",
      "tags",
    ] as const;

    const updateData: Record<string, unknown> = {};
    for (const field of PATCHABLE) {
      if (field in body) updateData[field] = body[field];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(accounts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(accounts.id, id), eq(accounts.orgId, orgId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ account: updated });
  } catch (error) {
    console.error("PATCH /api/accounts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
