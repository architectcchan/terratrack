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
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { createOrderSchema } from "@/lib/validations";

const VALID_STAGES = [
  "lead",
  "quote_sent",
  "confirmed",
  "processing",
  "ready_for_delivery",
  "delivered",
  "paid",
  "lost",
  "cancelled",
] as const;

const VALID_SOURCES = [
  "in_person",
  "phone",
  "text",
  "email",
  "leaflink",
  "growflow",
  "nabis",
  "distru",
  "other",
] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId;
    const { searchParams } = new URL(request.url);

    const stagesParam = searchParams.get("stages") || "";
    const repId = searchParams.get("rep_id") || "";
    const accountId = searchParams.get("account_id") || "";
    const source = searchParams.get("source") || "";

    const validStages = stagesParam
      ? stagesParam
          .split(",")
          .filter((s): s is (typeof VALID_STAGES)[number] =>
            (VALID_STAGES as readonly string[]).includes(s),
          )
      : [];

    const conditions = [eq(orders.orgId, orgId)];

    if (validStages.length > 0) {
      conditions.push(inArray(orders.stage, validStages));
    }
    if (repId) conditions.push(eq(orders.repId, repId));
    if (accountId) conditions.push(eq(orders.accountId, accountId));
    if (source && (VALID_SOURCES as readonly string[]).includes(source)) {
      conditions.push(
        eq(
          orders.source,
          source as (typeof VALID_SOURCES)[number],
        ),
      );
    }

    const stageEnteredAt = sql<string | null>`(
      SELECT COALESCE(
        (SELECT MAX(osh.changed_at)
         FROM ${orderStageHistory} osh
         WHERE osh.order_id = ${orders.id}
         AND osh.to_stage = ${orders.stage}::text),
        ${orders.createdAt}
      )
    )`;

    const lineItemsSummary = sql<
      Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: string;
        discountPercent: string;
        lineTotal: string;
      }> | null
    >`(
      SELECT json_agg(
        json_build_object(
          'productId', oli.product_id,
          'productName', p.name,
          'quantity', oli.quantity,
          'unitPrice', oli.unit_price::text,
          'discountPercent', oli.discount_percent::text,
          'lineTotal', oli.line_total::text
        )
      )
      FROM ${orderLineItems} oli
      JOIN ${products} p ON oli.product_id = p.id
      WHERE oli.order_id = ${orders.id}
    )`;

    const lineItemCount = sql<number>`(
      SELECT COUNT(*)::int
      FROM ${orderLineItems} oli
      WHERE oli.order_id = ${orders.id}
    )`;

    const result = await db
      .select({
        id: orders.id,
        accountId: orders.accountId,
        accountName: accounts.name,
        repId: orders.repId,
        repFirstName: users.firstName,
        repLastName: users.lastName,
        repAvatarUrl: users.avatarUrl,
        stage: orders.stage,
        source: orders.source,
        expectedCloseDate: orders.expectedCloseDate,
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
        stageEnteredAt,
        lineItems: lineItemsSummary,
        lineItemCount,
      })
      .from(orders)
      .leftJoin(accounts, eq(orders.accountId, accounts.id))
      .leftJoin(users, eq(orders.repId, users.id))
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({ orders: result });
  } catch (error) {
    console.error("GET /api/orders error:", error);
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
    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const data = result.data;
    const orgId = session.user.orgId;
    const repId = data.repId ?? session.user.id;

    let subtotal = 0;
    let discountAmount = 0;

    const lineItemData = data.lineItems.map((item) => {
      const unitPrice = parseFloat(item.unitPrice);
      const qty = item.quantity;
      const discPct = parseFloat(item.discountPercent || "0");
      const lineTotal = unitPrice * qty * (1 - discPct / 100);
      subtotal += unitPrice * qty;
      discountAmount += unitPrice * qty - lineTotal;
      return {
        productId: item.productId,
        quantity: qty,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || "0",
        lineTotal: lineTotal.toFixed(2),
        notes: item.notes ?? null,
      };
    });

    const total = subtotal - discountAmount;

    const [order] = await db
      .insert(orders)
      .values({
        orgId,
        accountId: data.accountId,
        repId,
        stage: data.stage,
        source: data.source,
        expectedCloseDate: data.expectedCloseDate ?? null,
        paymentTerms: data.paymentTerms,
        linkedVisitId: data.linkedVisitId ?? null,
        linkedSampleId: data.linkedSampleId ?? null,
        notes: data.notes ?? null,
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        taxAmount: "0",
        total: total.toFixed(2),
      })
      .returning();

    await db.insert(orderLineItems).values(
      lineItemData.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        lineTotal: item.lineTotal,
        notes: item.notes,
      })),
    );

    await db.insert(orderStageHistory).values({
      orderId: order.id,
      fromStage: null,
      toStage: data.stage,
      changedBy: session.user.id,
      notes: "Order created",
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
