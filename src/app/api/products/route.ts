import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const statusFilter = searchParams.get("status") || "active";

    const conditions = [eq(products.orgId, orgId)];

    if (statusFilter && statusFilter !== "all") {
      conditions.push(
        eq(
          products.status,
          statusFilter as "active" | "limited" | "out_of_stock" | "discontinued"
        )
      );
    }

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(products.name, pattern),
          ilike(products.sku, pattern),
          ilike(products.strainName, pattern)
        )!
      );
    }

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        category: products.category,
        strainName: products.strainName,
        strainType: products.strainType,
        unitSize: products.unitSize,
        status: products.status,
      })
      .from(products)
      .where(and(...conditions))
      .limit(50);

    return NextResponse.json({ products: rows });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
