import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { samples, users, contacts, accounts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

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
        id: samples.id,
        droppedOffDate: samples.droppedOffDate,
        productsSampled: samples.productsSampled,
        status: samples.status,
        feedbackDueDate: samples.feedbackDueDate,
        feedbackNotes: samples.feedbackNotes,
        followUpCount: samples.followUpCount,
        lastFollowUpDate: samples.lastFollowUpDate,
        convertedOrderId: samples.convertedOrderId,
        notes: samples.notes,
        createdAt: samples.createdAt,
        repFirstName: users.firstName,
        repLastName: users.lastName,
        recipientFirstName: contacts.firstName,
        recipientLastName: contacts.lastName,
      })
      .from(samples)
      // Verify the account belongs to this org (handles seed orgId mismatches
      // where samples.orgId may differ from accounts.orgId)
      .innerJoin(
        accounts,
        and(eq(accounts.id, samples.accountId), eq(accounts.orgId, orgId)),
      )
      .leftJoin(users, eq(samples.repId, users.id))
      .leftJoin(contacts, eq(samples.recipientContactId, contacts.id))
      .where(eq(samples.accountId, id))
      .orderBy(desc(samples.droppedOffDate));

    return NextResponse.json({ samples: rows });
  } catch (error) {
    console.error("GET /api/accounts/[id]/samples error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
