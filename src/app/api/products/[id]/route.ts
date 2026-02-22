import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateProductSchema } from "@/lib/validations";

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

    const result = updateProductSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const data = result.data;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.category !== undefined) updateData.category = data.category ?? null;
    if (data.subcategory !== undefined)
      updateData.subcategory = data.subcategory ?? null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.strainName !== undefined)
      updateData.strainName = data.strainName ?? null;
    if (data.strainType !== undefined)
      updateData.strainType = data.strainType ?? null;
    if (data.description !== undefined)
      updateData.description = data.description ?? null;
    if (data.thcPercentMin !== undefined)
      updateData.thcPercentMin = data.thcPercentMin ?? null;
    if (data.thcPercentMax !== undefined)
      updateData.thcPercentMax = data.thcPercentMax ?? null;
    if (data.cbdPercentMin !== undefined)
      updateData.cbdPercentMin = data.cbdPercentMin ?? null;
    if (data.cbdPercentMax !== undefined)
      updateData.cbdPercentMax = data.cbdPercentMax ?? null;
    if (data.growType !== undefined) updateData.growType = data.growType ?? null;
    if (data.turnaroundTime !== undefined)
      updateData.turnaroundTime = data.turnaroundTime ?? null;
    if (data.minimumOrder !== undefined)
      updateData.minimumOrder = data.minimumOrder ?? null;
    if (data.wholesalePrice !== undefined)
      updateData.wholesalePrice = data.wholesalePrice;
    if (data.msrp !== undefined) updateData.msrp = data.msrp ?? null;
    if (data.availableInventory !== undefined) {
      updateData.availableInventory =
        data.availableInventory != null
          ? parseInt(String(data.availableInventory), 10)
          : null;
    }
    if (data.unitSize !== undefined) updateData.unitSize = data.unitSize;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl ?? null;
    if (data.coaUrl !== undefined) updateData.coaUrl = data.coaUrl ?? null;

    const [product] = await db
      .update(products)
      .set(updateData)
      .where(and(eq(products.id, id), eq(products.orgId, orgId)))
      .returning();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("PATCH /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
