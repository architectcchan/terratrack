import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderStageHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { moveOrderSchema } from "@/lib/validations";

export async function POST(
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

    const [existing] = await db
      .select({ id: orders.id, stage: orders.stage })
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.orgId, orgId)));

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = moveOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const { stage, lossReason, notes } = result.data;

    const updateData: Record<string, unknown> = {
      stage,
      updatedAt: new Date(),
    };

    if (lossReason) updateData.lossReason = lossReason;

    if (stage === "paid") {
      updateData.actualCloseDate = new Date().toISOString().split("T")[0];
    }
    if (stage === "delivered") {
      updateData.deliveryDate = new Date().toISOString().split("T")[0];
    }

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(and(eq(orders.id, id), eq(orders.orgId, orgId)))
      .returning();

    await db.insert(orderStageHistory).values({
      orderId: id,
      fromStage: existing.stage,
      toStage: stage,
      changedBy: session.user.id,
      notes: notes ?? null,
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("POST /api/orders/[id]/move error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
