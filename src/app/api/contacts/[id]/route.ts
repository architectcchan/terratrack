import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateContactSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z
    .enum([
      "buyer",
      "store_manager",
      "assistant_manager",
      "budtender",
      "owner",
      "other",
    ])
    .optional(),
  roleLabel: z.string().max(100).nullish(),
  isPrimaryDecisionMaker: z.boolean().optional(),
  phone: z.string().max(20).nullish(),
  email: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().email().max(255).nullable().optional(),
  ),
  preferredContactMethod: z
    .enum(["phone", "email", "text", "in_person"])
    .optional(),
  bestVisitDays: z.array(z.string()).nullish(),
  bestVisitTimes: z.string().max(100).nullish(),
  notes: z.string().nullish(),
  isActive: z.boolean().optional(),
});

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

    const result = updateContactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const data = result.data;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const fields = [
      "firstName",
      "lastName",
      "role",
      "roleLabel",
      "isPrimaryDecisionMaker",
      "phone",
      "email",
      "preferredContactMethod",
      "bestVisitDays",
      "bestVisitTimes",
      "notes",
      "isActive",
    ] as const;

    for (const field of fields) {
      if (field in data && data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const [updated] = await db
      .update(contacts)
      .set(updateData)
      .where(and(eq(contacts.id, id), eq(contacts.orgId, orgId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ contact: updated });
  } catch (error) {
    console.error("PATCH /api/contacts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
