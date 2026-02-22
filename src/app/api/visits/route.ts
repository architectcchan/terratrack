import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  visits,
  accounts,
  users,
  samples,
  tasks,
} from "@/db/schema";
import {
  eq,
  and,
  desc,
  sql,
  gte,
  lte,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";

const createVisitSchema = z.object({
  accountId: z.string().uuid(),
  visitType: z.enum([
    "scheduled_meeting",
    "drop_in",
    "delivery",
    "budtender_training",
    "sample_drop",
    "vendor_day",
    "popup_event",
    "other",
  ]),
  outcome: z
    .enum([
      "order_placed",
      "reorder_confirmed",
      "sample_left",
      "follow_up_needed",
      "no_decision",
      "buyer_unavailable",
      "declined",
      "other",
    ])
    .nullish(),
  contactsMet: z.array(z.string().uuid()).nullish(),
  productsDiscussed: z.array(z.string().uuid()).nullish(),
  notes: z.string().nullish(),
  checkInLat: z.string().nullish(),
  checkInLng: z.string().nullish(),
  nextFollowUpDate: z.string().nullish(),
  nextFollowUpNotes: z.string().nullish(),
  buyerFeedbackLook: z.enum(["positive", "neutral", "negative"]).nullish(),
  buyerFeedbackSmell: z.enum(["positive", "neutral", "negative"]).nullish(),
  buyerFeedbackPackaging: z
    .enum(["positive", "neutral", "negative"])
    .nullish(),
  buyerFeedbackPricing: z.enum(["fits", "too_high", "too_low"]).nullish(),
  shelfAvailability: z.enum(["has_opening", "full", "unknown"]).nullish(),
  competitorBrandsNoted: z.array(z.string()).nullish(),
  voiceNoteDuration: z.number().nullish(),
  sampleData: z
    .object({
      productsSampled: z
        .array(
          z.object({
            productId: z.string().uuid().optional(),
            productName: z.string().min(1),
            quantity: z.number().int().min(1),
            unitSize: z.string().optional(),
          })
        )
        .min(1),
      recipientContactId: z.string().uuid().nullish(),
      recipientName: z.string().nullish(),
    })
    .nullish(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createVisitSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      );
    }

    const data = result.data;
    const orgId = session.user.orgId;
    const repId = session.user.id;

    const [visit] = await db
      .insert(visits)
      .values({
        orgId,
        accountId: data.accountId,
        repId,
        visitType: data.visitType,
        outcome: data.outcome ?? null,
        contactsMet: data.contactsMet ?? null,
        productsDiscussed: data.productsDiscussed ?? null,
        notes: data.notes ?? null,
        checkInLat: data.checkInLat ?? null,
        checkInLng: data.checkInLng ?? null,
        checkInTime: new Date(),
        nextFollowUpDate: data.nextFollowUpDate ?? null,
        nextFollowUpNotes: data.nextFollowUpNotes ?? null,
        buyerFeedbackLook: data.buyerFeedbackLook ?? null,
        buyerFeedbackSmell: data.buyerFeedbackSmell ?? null,
        buyerFeedbackPackaging: data.buyerFeedbackPackaging ?? null,
        buyerFeedbackPricing: data.buyerFeedbackPricing ?? null,
        shelfAvailability: data.shelfAvailability ?? null,
        competitorBrandsNoted: data.competitorBrandsNoted ?? null,
      })
      .returning();

    const autoCreated: {
      sampleId?: string;
      taskIds: string[];
    } = { taskIds: [] };

    if (data.sampleData && data.outcome === "sample_left") {
      const today = new Date();
      const feedbackDue = new Date(today);
      feedbackDue.setDate(feedbackDue.getDate() + 42);

      const [sample] = await db
        .insert(samples)
        .values({
          orgId,
          accountId: data.accountId,
          visitId: visit.id,
          repId,
          droppedOffDate: today.toISOString().split("T")[0],
          productsSampled: data.sampleData.productsSampled,
          recipientContactId: data.sampleData.recipientContactId ?? null,
          status: "delivered",
          feedbackDueDate: feedbackDue.toISOString().split("T")[0],
          followUpCount: 0,
        })
        .returning();

      autoCreated.sampleId = sample.id;

      const sevenDays = new Date(today);
      sevenDays.setDate(sevenDays.getDate() + 7);

      const [followUp7] = await db
        .insert(tasks)
        .values({
          orgId,
          accountId: data.accountId,
          assignedTo: repId,
          createdBy: repId,
          taskType: "sample_follow_up",
          title: `Sample follow-up (7 day)`,
          description: `Follow up on samples left during visit`,
          dueDate: sevenDays.toISOString().split("T")[0],
          priority: "medium",
          status: "open",
          linkedVisitId: visit.id,
          linkedSampleId: sample.id,
        })
        .returning();

      autoCreated.taskIds.push(followUp7.id);

      const [followUpFeedback] = await db
        .insert(tasks)
        .values({
          orgId,
          accountId: data.accountId,
          assignedTo: repId,
          createdBy: repId,
          taskType: "sample_follow_up",
          title: `Sample feedback due`,
          description: `Final feedback deadline for samples left during visit`,
          dueDate: feedbackDue.toISOString().split("T")[0],
          priority: "high",
          status: "open",
          linkedVisitId: visit.id,
          linkedSampleId: sample.id,
        })
        .returning();

      autoCreated.taskIds.push(followUpFeedback.id);
    }

    if (data.nextFollowUpDate) {
      const [followUpTask] = await db
        .insert(tasks)
        .values({
          orgId,
          accountId: data.accountId,
          assignedTo: repId,
          createdBy: repId,
          taskType: "follow_up_visit",
          title: `Follow-up visit`,
          description: data.nextFollowUpNotes ?? "Scheduled follow-up from visit",
          dueDate: data.nextFollowUpDate,
          priority: "medium",
          status: "open",
          linkedVisitId: visit.id,
        })
        .returning();

      autoCreated.taskIds.push(followUpTask.id);
    }

    await db
      .update(accounts)
      .set({ updatedAt: new Date() })
      .where(eq(accounts.id, data.accountId));

    return NextResponse.json({ visit, autoCreated }, { status: 201 });
  } catch (error) {
    console.error("POST /api/visits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId;
    const { searchParams } = new URL(request.url);

    const accountId = searchParams.get("account_id") || "";
    const repId = searchParams.get("rep_id") || "";
    const visitType = searchParams.get("visit_type") || "";
    const outcome = searchParams.get("outcome") || "";
    const dateFrom = searchParams.get("date_from") || "";
    const dateTo = searchParams.get("date_to") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25") || 25)
    );
    const recentForRepParam = searchParams.get("recent_for_rep") || "";
    const recentForRep = recentForRepParam === "me" ? session.user.id : recentForRepParam;

    if (recentForRep) {
      const recentVisits = await db
        .select({
          accountId: visits.accountId,
          accountName: accounts.name,
          city: accounts.city,
          status: accounts.status,
          lastVisitDate: sql<string>`MAX(${visits.checkInTime})`,
        })
        .from(visits)
        .innerJoin(accounts, eq(visits.accountId, accounts.id))
        .where(
          and(eq(visits.orgId, orgId), eq(visits.repId, recentForRep))
        )
        .groupBy(
          visits.accountId,
          accounts.name,
          accounts.city,
          accounts.status
        )
        .orderBy(desc(sql`MAX(${visits.checkInTime})`))
        .limit(5);

      return NextResponse.json({ recentAccounts: recentVisits });
    }

    const conditions: SQL[] = [eq(visits.orgId, orgId)];

    if (accountId) conditions.push(eq(visits.accountId, accountId));
    if (repId) conditions.push(eq(visits.repId, repId));
    if (visitType) {
      conditions.push(
        eq(
          visits.visitType,
          visitType as
            | "scheduled_meeting"
            | "drop_in"
            | "delivery"
            | "budtender_training"
            | "sample_drop"
            | "vendor_day"
            | "popup_event"
            | "other"
        )
      );
    }
    if (outcome) {
      conditions.push(
        eq(
          visits.outcome,
          outcome as
            | "order_placed"
            | "reorder_confirmed"
            | "sample_left"
            | "follow_up_needed"
            | "no_decision"
            | "buyer_unavailable"
            | "declined"
            | "other"
        )
      );
    }
    if (dateFrom) conditions.push(gte(visits.checkInTime, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(visits.checkInTime, new Date(dateTo)));

    const whereClause = and(...conditions);

    const [countResult] = await db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(visits)
      .where(whereClause);

    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: visits.id,
        accountId: visits.accountId,
        accountName: accounts.name,
        repId: visits.repId,
        repFirstName: users.firstName,
        repLastName: users.lastName,
        visitType: visits.visitType,
        outcome: visits.outcome,
        contactsMet: visits.contactsMet,
        productsDiscussed: visits.productsDiscussed,
        notes: visits.notes,
        checkInLat: visits.checkInLat,
        checkInLng: visits.checkInLng,
        checkInTime: visits.checkInTime,
        checkOutTime: visits.checkOutTime,
        nextFollowUpDate: visits.nextFollowUpDate,
        nextFollowUpNotes: visits.nextFollowUpNotes,
        buyerFeedbackLook: visits.buyerFeedbackLook,
        buyerFeedbackSmell: visits.buyerFeedbackSmell,
        buyerFeedbackPackaging: visits.buyerFeedbackPackaging,
        buyerFeedbackPricing: visits.buyerFeedbackPricing,
        shelfAvailability: visits.shelfAvailability,
        competitorBrandsNoted: visits.competitorBrandsNoted,
        createdAt: visits.createdAt,
      })
      .from(visits)
      .leftJoin(accounts, eq(visits.accountId, accounts.id))
      .leftJoin(users, eq(visits.repId, users.id))
      .where(whereClause)
      .orderBy(desc(visits.checkInTime))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ visits: rows, total, page, totalPages });
  } catch (error) {
    console.error("GET /api/visits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
