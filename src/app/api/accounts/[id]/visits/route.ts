import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { visits, users } from "@/db/schema";
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
        id: visits.id,
        checkInTime: visits.checkInTime,
        checkOutTime: visits.checkOutTime,
        visitType: visits.visitType,
        outcome: visits.outcome,
        notes: visits.notes,
        aiRawTranscript: visits.aiRawTranscript,
        photos: visits.photos,
        buyerFeedbackLook: visits.buyerFeedbackLook,
        buyerFeedbackSmell: visits.buyerFeedbackSmell,
        buyerFeedbackPackaging: visits.buyerFeedbackPackaging,
        buyerFeedbackPricing: visits.buyerFeedbackPricing,
        shelfAvailability: visits.shelfAvailability,
        competitorBrandsNoted: visits.competitorBrandsNoted,
        nextFollowUpDate: visits.nextFollowUpDate,
        nextFollowUpNotes: visits.nextFollowUpNotes,
        repFirstName: users.firstName,
        repLastName: users.lastName,
        repAvatarUrl: users.avatarUrl,
        contactsMetNames: sql<
          Array<{ firstName: string; lastName: string }> | null
        >`(
          SELECT json_agg(json_build_object(
            'firstName', c.first_name,
            'lastName', c.last_name
          ))
          FROM contacts c
          WHERE c.id = ANY(${visits.contactsMet})
        )`,
      })
      .from(visits)
      .leftJoin(users, eq(visits.repId, users.id))
      .where(and(eq(visits.accountId, id), eq(visits.orgId, orgId)))
      .orderBy(desc(visits.checkInTime));

    return NextResponse.json({ visits: rows });
  } catch (error) {
    console.error("GET /api/accounts/[id]/visits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
