import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

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

    const rows = await db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        stage: orders.stage,
        source: orders.source,
        total: orders.total,
        subtotal: orders.subtotal,
        discountAmount: orders.discountAmount,
        paymentStatus: orders.paymentStatus,
        paymentTerms: orders.paymentTerms,
        deliveryDate: orders.deliveryDate,
        expectedCloseDate: orders.expectedCloseDate,
        notes: orders.notes,
        repFirstName: users.firstName,
        repLastName: users.lastName,
        lineItemsSummary: sql<
          Array<{ productName: string; quantity: number; lineTotal: string }> | null
        >`(
          SELECT json_agg(json_build_object(
            'productName', p.name,
            'quantity', oli.quantity,
            'lineTotal', oli.line_total::text
          ) ORDER BY p.name)
          FROM order_line_items oli
          JOIN products p ON p.id = oli.product_id
          WHERE oli.order_id = ${orders.id}
        )`,
        lineItemCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM order_line_items oli
          WHERE oli.order_id = ${orders.id}
        )`,
      })
      .from(orders)
      .leftJoin(users, eq(orders.repId, users.id))
      .where(and(eq(orders.accountId, id), eq(orders.orgId, orgId)))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({ orders: rows });
  } catch (error) {
    console.error("GET /api/accounts/[id]/orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
