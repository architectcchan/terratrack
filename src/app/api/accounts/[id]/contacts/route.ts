import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

const createContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
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
});

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
      .select()
      .from(contacts)
      .where(and(eq(contacts.accountId, id), eq(contacts.orgId, orgId)))
      .orderBy(asc(contacts.lastName), asc(contacts.firstName));

    return NextResponse.json({ contacts: rows });
  } catch (error) {
    console.error("GET /api/accounts/[id]/contacts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
    const body = await request.json();

    const result = createContactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const data = result.data;

    const [contact] = await db
      .insert(contacts)
      .values({
        accountId: id,
        orgId,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role ?? "buyer",
        roleLabel: data.roleLabel ?? null,
        isPrimaryDecisionMaker: data.isPrimaryDecisionMaker ?? false,
        phone: data.phone ?? null,
        email: data.email ?? null,
        preferredContactMethod: data.preferredContactMethod ?? "phone",
        bestVisitDays: data.bestVisitDays ?? null,
        bestVisitTimes: data.bestVisitTimes ?? null,
        notes: data.notes ?? null,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error("POST /api/accounts/[id]/contacts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
