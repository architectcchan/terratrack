import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import {
  eq,
  and,
  or,
  ilike,
  inArray,
  gte,
  lte,
  sql,
  desc,
  asc,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createProductSchema } from "@/lib/validations";

const VALID_CATEGORIES = [
  "flower",
  "pre_roll",
  "edible",
  "vape",
  "concentrate",
  "topical",
  "tincture",
  "accessory",
  "other",
] as const;

const VALID_STRAIN_TYPES = [
  "indica",
  "sativa",
  "hybrid",
  "cbd",
  "blend",
] as const;

const VALID_STATUSES = [
  "active",
  "limited",
  "out_of_stock",
  "discontinued",
] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const categoryParam = searchParams.get("category") || "";
    const strainTypeParam = searchParams.get("strain_type") || "";
    const statusParam = searchParams.get("status") || "";
    const priceMin = searchParams.get("price_min") || "";
    const priceMax = searchParams.get("price_max") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") || "100") || 100),
    );
    const sortBy = searchParams.get("sort_by") || "name";
    const sortOrder =
      searchParams.get("sort_order") === "desc" ? "desc" : "asc";

    const validatedCategories = categoryParam
      .split(",")
      .filter((c): c is (typeof VALID_CATEGORIES)[number] =>
        (VALID_CATEGORIES as readonly string[]).includes(c),
      );

    const validatedStrainTypes = strainTypeParam
      .split(",")
      .filter((s): s is (typeof VALID_STRAIN_TYPES)[number] =>
        (VALID_STRAIN_TYPES as readonly string[]).includes(s),
      );

    const validatedStatuses = statusParam
      .split(",")
      .filter((s): s is (typeof VALID_STATUSES)[number] =>
        (VALID_STATUSES as readonly string[]).includes(s),
      );

    const conditions: SQL[] = [eq(products.orgId, orgId)];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(products.name, pattern),
          ilike(products.sku, pattern),
          ilike(products.strainName, pattern),
        )!,
      );
    }

    if (validatedCategories.length > 0) {
      conditions.push(inArray(products.category, validatedCategories));
    }

    if (validatedStrainTypes.length > 0) {
      conditions.push(inArray(products.strainType, validatedStrainTypes));
    }

    if (validatedStatuses.length > 0) {
      conditions.push(inArray(products.status, validatedStatuses));
    }

    if (priceMin) {
      conditions.push(gte(products.wholesalePrice, priceMin));
    }

    if (priceMax) {
      conditions.push(lte(products.wholesalePrice, priceMax));
    }

    const whereClause = and(...conditions);

    const [countResult] = await db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(products)
      .where(whereClause);

    const total = countResult?.total ?? 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const direction = sortOrder === "desc" ? desc : asc;
    let orderByExpr;
    switch (sortBy) {
      case "sku":
        orderByExpr = direction(products.sku);
        break;
      case "category":
        orderByExpr = direction(products.category);
        break;
      case "status":
        orderByExpr = direction(products.status);
        break;
      case "wholesalePrice":
        orderByExpr = direction(products.wholesalePrice);
        break;
      case "msrp":
        orderByExpr = direction(products.msrp);
        break;
      case "availableInventory":
        orderByExpr = direction(products.availableInventory);
        break;
      case "createdAt":
        orderByExpr = direction(products.createdAt);
        break;
      default:
        orderByExpr = direction(products.name);
    }

    const rows = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(orderByExpr)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ products: rows, total, page, totalPages });
  } catch (error) {
    console.error("GET /api/products error:", error);
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
    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const data = result.data;

    const [product] = await db
      .insert(products)
      .values({
        orgId: session.user.orgId,
        name: data.name,
        sku: data.sku,
        category: data.category ?? null,
        subcategory: data.subcategory ?? null,
        status: data.status,
        strainName: data.strainName ?? null,
        strainType: data.strainType ?? null,
        description: data.description ?? null,
        thcPercentMin: data.thcPercentMin ?? null,
        thcPercentMax: data.thcPercentMax ?? null,
        cbdPercentMin: data.cbdPercentMin ?? null,
        cbdPercentMax: data.cbdPercentMax ?? null,
        growType: data.growType ?? null,
        turnaroundTime: data.turnaroundTime ?? null,
        minimumOrder: data.minimumOrder ?? null,
        wholesalePrice: data.wholesalePrice,
        msrp: data.msrp ?? null,
        availableInventory:
          data.availableInventory != null
            ? parseInt(String(data.availableInventory), 10)
            : null,
        unitSize: data.unitSize,
        imageUrl: data.imageUrl ?? null,
        coaUrl: data.coaUrl ?? null,
      })
      .returning();

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
