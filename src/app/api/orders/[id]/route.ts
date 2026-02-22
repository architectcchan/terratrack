import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  orders,
  accounts,
  users,
  orderLineItems,
  orderStageHistory,
  products,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { updateOrderSchema } from "@/lib/validations";

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

    const [order] = await db
      .select({
        id: orders.id,
        orgId: orders.orgId,
        accountId: orders.accountId,
        accountName: accounts.name,
        repId: orders.repId,
        repFirstName: users.firstName,
        repLastName: users.lastName,
        repAvatarUrl: users.avatarUrl,
        stage: orders.stage,
        source: orders.source,
        expectedCloseDate: orders.expectedCloseDate,
        actualCloseDate: orders.actualCloseDate,
        deliveryDate: orders.deliveryDate,
        total: orders.total,
        subtotal: orders.subtotal,
        discountAmount: orders.discountAmount,
        taxAmount: orders.taxAmount,
        paymentTerms: orders.paymentTerms,
        paymentStatus: orders.paymentStatus,
        linkedVisitId: orders.linkedVisitId,
        linkedSampleId: orders.linkedSampleId,
        lossReason: orders.lossReason,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .leftJoin(accounts, eq(orders.accountId, accounts.id))
      .leftJoin(users, eq(orders.repId, users.id))
      .where(and(eq(orders.id, id), eq(orders.orgId, orgId)));

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const lineItems = await db
      .select({
        id: orderLineItems.id,
        orderId: orderLineItems.orderId,
        productId: orderLineItems.productId,
        productName: products.name,
        productSku: products.sku,
        productCategory: products.category,
        quantity: orderLineItems.quantity,
        unitPrice: orderLineItems.unitPrice,
        discountPercent: orderLineItems.discountPercent,
        lineTotal: orderLineItems.lineTotal,
        notes: orderLineItems.notes,
      })
      .from(orderLineItems)
      .leftJoin(products, eq(orderLineItems.productId, products.id))
      .where(eq(orderLineItems.orderId, id));

    const stageHistory = await db
      .select({
        id: orderStageHistory.id,
        fromStage: orderStageHistory.fromStage,
        toStage: orderStageHistory.toStage,
        changedBy: orderStageHistory.changedBy,
        changedByFirstName: users.firstName,
        changedByLastName: users.lastName,
        changedByAvatarUrl: users.avatarUrl,
        changedAt: orderStageHistory.changedAt,
        notes: orderStageHistory.notes,
      })
      .from(orderStageHistory)
      .leftJoin(users, eq(orderStageHistory.changedBy, users.id))
      .where(eq(orderStageHistory.orderId, id))
      .orderBy(asc(orderStageHistory.changedAt));

    return NextResponse.json({ order: { ...order, lineItems, stageHistory } });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
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

    const [existing] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.orgId, orgId)));

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = updateOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const d = result.data;
    if (d.expectedCloseDate !== undefined)
      updateData.expectedCloseDate = d.expectedCloseDate ?? null;
    if (d.actualCloseDate !== undefined)
      updateData.actualCloseDate = d.actualCloseDate ?? null;
    if (d.deliveryDate !== undefined)
      updateData.deliveryDate = d.deliveryDate ?? null;
    if (d.paymentStatus !== undefined)
      updateData.paymentStatus = d.paymentStatus;
    if (d.paymentTerms !== undefined) updateData.paymentTerms = d.paymentTerms;
    if (d.notes !== undefined) updateData.notes = d.notes ?? null;
    if (d.source !== undefined) updateData.source = d.source;

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(and(eq(orders.id, id), eq(orders.orgId, orgId)))
      .returning();

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
