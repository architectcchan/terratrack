import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { visits, orders, samples, tasks, users } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0") || 0);
    const limit = 20;

    const [visitsData, ordersData, samplesData, tasksData] = await Promise.all([
      db
        .select({
          id: visits.id,
          timestamp: visits.checkInTime,
          repFirstName: users.firstName,
          repLastName: users.lastName,
          visitType: visits.visitType,
          outcome: visits.outcome,
          notes: visits.notes,
          buyerFeedbackLook: visits.buyerFeedbackLook,
          buyerFeedbackSmell: visits.buyerFeedbackSmell,
          buyerFeedbackPackaging: visits.buyerFeedbackPackaging,
          buyerFeedbackPricing: visits.buyerFeedbackPricing,
          shelfAvailability: visits.shelfAvailability,
          competitorBrandsNoted: visits.competitorBrandsNoted,
          aiRawTranscript: visits.aiRawTranscript,
          photos: visits.photos,
          checkOutTime: visits.checkOutTime,
        })
        .from(visits)
        .leftJoin(users, eq(visits.repId, users.id))
        .where(and(eq(visits.accountId, id), eq(visits.orgId, orgId)))
        .orderBy(desc(visits.checkInTime)),

      db
        .select({
          id: orders.id,
          timestamp: orders.createdAt,
          repFirstName: users.firstName,
          repLastName: users.lastName,
          stage: orders.stage,
          total: orders.total,
          paymentStatus: orders.paymentStatus,
          source: orders.source,
          notes: orders.notes,
          lineItemsSummary: sql<
            Array<{ productName: string; quantity: number }> | null
          >`(
            SELECT json_agg(json_build_object(
              'productName', p.name,
              'quantity', oli.quantity
            ) ORDER BY p.name)
            FROM order_line_items oli
            JOIN products p ON p.id = oli.product_id
            WHERE oli.order_id = ${orders.id}
          )`,
        })
        .from(orders)
        .leftJoin(users, eq(orders.repId, users.id))
        .where(and(eq(orders.accountId, id), eq(orders.orgId, orgId)))
        .orderBy(desc(orders.createdAt)),

      db
        .select({
          id: samples.id,
          timestamp: samples.createdAt,
          repFirstName: users.firstName,
          repLastName: users.lastName,
          productsSampled: samples.productsSampled,
          status: samples.status,
          feedbackNotes: samples.feedbackNotes,
          droppedOffDate: samples.droppedOffDate,
        })
        .from(samples)
        .leftJoin(users, eq(samples.repId, users.id))
        .where(and(eq(samples.accountId, id), eq(samples.orgId, orgId)))
        .orderBy(desc(samples.createdAt)),

      db
        .select({
          id: tasks.id,
          timestamp: tasks.createdAt,
          repFirstName: users.firstName,
          repLastName: users.lastName,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
          dueDate: tasks.dueDate,
          description: tasks.description,
          taskType: tasks.taskType,
        })
        .from(tasks)
        .leftJoin(users, eq(tasks.assignedTo, users.id))
        .where(and(eq(tasks.accountId, id), eq(tasks.orgId, orgId)))
        .orderBy(desc(tasks.createdAt)),
    ]);

    const allActivity = [
      ...visitsData.map((v) => ({ ...v, type: "visit" as const })),
      ...ordersData.map((o) => ({ ...o, type: "order" as const })),
      ...samplesData.map((s) => ({ ...s, type: "sample" as const })),
      ...tasksData.map((t) => ({ ...t, type: "task" as const })),
    ].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const total = allActivity.length;
    const paged = allActivity.slice(offset, offset + limit);

    return NextResponse.json({
      activity: paged,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("GET /api/accounts/[id]/activity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
