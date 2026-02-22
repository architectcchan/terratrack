import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { samples } from "@/db/schema";
import { z } from "zod";

const createSampleSchema = z.object({
  accountId: z.string().uuid(),
  droppedOffDate: z.string().min(1),
  productsSampled: z.array(
    z.object({
      productName: z.string().min(1),
      quantity: z.number().int().min(1),
      unitSize: z.string().optional(),
    }),
  ).min(1),
  recipientContactId: z.string().uuid().nullish(),
  feedbackDueDate: z.string().nullish(),
  notes: z.string().nullish(),
  visitId: z.string().uuid().nullish(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createSampleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const data = result.data;
    const orgId = session.user.orgId;

    const [sample] = await db
      .insert(samples)
      .values({
        orgId,
        accountId: data.accountId,
        repId: session.user.id,
        droppedOffDate: data.droppedOffDate,
        productsSampled: data.productsSampled,
        recipientContactId: data.recipientContactId ?? null,
        feedbackDueDate: data.feedbackDueDate ?? null,
        notes: data.notes ?? null,
        visitId: data.visitId ?? null,
        status: "delivered",
        followUpCount: 0,
      })
      .returning();

    return NextResponse.json({ sample }, { status: 201 });
  } catch (error) {
    console.error("POST /api/samples error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
