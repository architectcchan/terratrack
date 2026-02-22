import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  accounts,
  users,
  visits,
  orders,
  contacts,
  accountChains,
} from "@/db/schema";
import { eq, and, or, ilike, inArray, sql, desc, asc } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createAccountSchema } from "@/lib/validations";

const VALID_STATUSES = [
  "prospect",
  "sample_sent",
  "active",
  "at_risk",
  "dormant",
  "churned",
] as const;

const VALID_TIERS = ["A", "B", "C", "D", "unranked"] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const statusParam = searchParams.get("status") || "";
    const tierParam = searchParams.get("tier") || "";
    const repId = searchParams.get("rep_id") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25") || 25),
    );
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder =
      searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

    const validatedStatuses = statusParam
      .split(",")
      .filter((s): s is (typeof VALID_STATUSES)[number] =>
        (VALID_STATUSES as readonly string[]).includes(s),
      );
    const validatedTiers = tierParam
      .split(",")
      .filter((t): t is (typeof VALID_TIERS)[number] =>
        (VALID_TIERS as readonly string[]).includes(t),
      );

    const conditions: SQL[] = [eq(accounts.orgId, orgId)];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(accounts.name, pattern),
          ilike(accounts.city, pattern),
          sql`EXISTS (
            SELECT 1 FROM ${contacts}
            WHERE ${contacts.accountId} = ${accounts.id}
            AND (${contacts.firstName} || ' ' || ${contacts.lastName}) ILIKE ${pattern}
          )`,
        )!,
      );
    }

    if (validatedStatuses.length > 0) {
      conditions.push(inArray(accounts.status, validatedStatuses));
    }

    if (validatedTiers.length > 0) {
      conditions.push(inArray(accounts.revenueTier, validatedTiers));
    }

    if (repId) {
      conditions.push(eq(accounts.assignedRepId, repId));
    }

    const whereClause = and(...conditions);

    const lastVisitDate = sql<string | null>`(
      SELECT MAX(${visits.checkInTime})
      FROM ${visits}
      WHERE ${visits.accountId} = ${accounts.id}
    )`;

    const lastOrderDate = sql<string | null>`(
      SELECT MAX(${orders.createdAt})
      FROM ${orders}
      WHERE ${orders.accountId} = ${accounts.id}
    )`;

    const [countResult] = await db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(accounts)
      .where(whereClause);

    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const direction = sortOrder === "desc" ? desc : asc;
    let orderByExpr;
    switch (sortBy) {
      case "city":
        orderByExpr = direction(accounts.city);
        break;
      case "status":
        orderByExpr = direction(accounts.status);
        break;
      case "revenueTier":
        orderByExpr = direction(accounts.revenueTier);
        break;
      case "lastVisitDate":
        orderByExpr = direction(lastVisitDate);
        break;
      case "lastOrderDate":
        orderByExpr = direction(lastOrderDate);
        break;
      default:
        orderByExpr = direction(accounts.name);
    }

    const results = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        dbaName: accounts.dbaName,
        city: accounts.city,
        state: accounts.state,
        status: accounts.status,
        revenueTier: accounts.revenueTier,
        chainId: accounts.chainId,
        chainName: accountChains.name,
        assignedRepId: accounts.assignedRepId,
        repFirstName: users.firstName,
        repLastName: users.lastName,
        tags: accounts.tags,
        lastVisitDate,
        lastOrderDate,
      })
      .from(accounts)
      .leftJoin(users, eq(accounts.assignedRepId, users.id))
      .leftJoin(accountChains, eq(accounts.chainId, accountChains.id))
      .where(whereClause)
      .orderBy(orderByExpr)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      accounts: results,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createAccountSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const data = result.data;

    const [account] = await db
      .insert(accounts)
      .values({
        orgId: session.user.orgId,
        name: data.name,
        dbaName: data.dbaName ?? null,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 ?? null,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone ?? null,
        email: data.email ?? null,
        website: data.website ?? null,
        licenseNumber: data.licenseNumber ?? null,
        licenseType: data.licenseType,
        status: data.status,
        revenueTier: data.revenueTier,
        assignedRepId: data.assignedRepId ?? null,
        territoryId: data.territoryId ?? null,
        chainId: data.chainId ?? null,
        paymentTerms: data.paymentTerms,
        notes: data.notes ?? null,
        tags: data.tags ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("POST /api/accounts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
