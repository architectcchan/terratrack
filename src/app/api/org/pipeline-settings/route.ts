import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import {
  type OrderStage,
  ACTIVE_STAGES,
  CLOSED_STAGES,
} from "@/types";

const pipelineSettingsSchema = z.object({
  order: z.array(z.string()).refine(
    (arr) => arr.every((s) => [...ACTIVE_STAGES, ...CLOSED_STAGES].includes(s as OrderStage)),
    { message: "Invalid stage ids" },
  ),
  labels: z.record(z.string(), z.string()).optional(),
});

export type PipelineSettings = z.infer<typeof pipelineSettingsSchema>;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [org] = await db
      .select({ orgSettings: organizations.orgSettings })
      .from(organizations)
      .where(eq(organizations.id, session.user.orgId))
      .limit(1);

    if (!org?.orgSettings || typeof org.orgSettings !== "object") {
      return NextResponse.json({ pipelineStages: null });
    }

    const settings = org.orgSettings as Record<string, unknown>;
    const pipelineStages = settings.pipelineStages as PipelineSettings | undefined;

    if (!pipelineStages) {
      return NextResponse.json({ pipelineStages: null });
    }

    return NextResponse.json({ pipelineStages });
  } catch {
    return NextResponse.json(
      { error: "Failed to load pipeline settings" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = pipelineSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const [org] = await db
      .select({ orgSettings: organizations.orgSettings })
      .from(organizations)
      .where(eq(organizations.id, session.user.orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const currentSettings =
      (typeof org.orgSettings === "object" && org.orgSettings !== null
        ? org.orgSettings
        : {}) as Record<string, unknown>;

    const updatedSettings = {
      ...currentSettings,
      pipelineStages: parsed.data,
    };

    await db
      .update(organizations)
      .set({
        orgSettings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, session.user.orgId));

    return NextResponse.json({
      pipelineStages: parsed.data,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update pipeline settings" },
      { status: 500 },
    );
  }
}
