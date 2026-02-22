import { NextResponse } from "next/server";
import { db } from "@/db";
import { samples, accounts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: samples.id,
        accountId: samples.accountId,
        orgId: samples.orgId,
        status: samples.status,
        droppedOffDate: samples.droppedOffDate,
        repId: samples.repId,
      })
      .from(samples)
      .limit(10);

    const [countResult] = await db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(samples);

    // Look up the account name for the known sample account
    const [knownAccount] = await db
      .select({ id: accounts.id, name: accounts.name, orgId: accounts.orgId })
      .from(accounts)
      .where(eq(accounts.id, "f870f6c5-5992-4853-b677-6d1a0723544f"))
      .limit(1);

    return NextResponse.json({
      total: countResult.total,
      samples: rows,
      knownAccount: knownAccount ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 },
    );
  }
}
