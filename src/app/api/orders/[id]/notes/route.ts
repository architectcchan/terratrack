import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const addNoteSchema = z.object({
  note: z.string().min(1, "Note is required"),
});

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

    const [existing] = await db
      .select({ id: orders.id, notes: orders.notes })
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.orgId, orgId)));

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = addNoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 },
      );
    }

    const now = new Date();
    const timestamp = now.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const author = `${session.user.firstName} ${session.user.lastName}`;
    const newLine = `[${timestamp} — ${author}]: ${result.data.note}`;
    const updatedNotes = existing.notes
      ? `${newLine}\n\n${existing.notes}`
      : newLine;

    const [updated] = await db
      .update(orders)
      .set({ notes: updatedNotes, updatedAt: new Date() })
      .where(and(eq(orders.id, id), eq(orders.orgId, orgId)))
      .returning();

    return NextResponse.json({ notes: updated.notes });
  } catch (error) {
    console.error("POST /api/orders/[id]/notes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
