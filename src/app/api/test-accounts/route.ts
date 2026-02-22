import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const session = await auth();

    const allAccounts = await sql`
      SELECT id, name, org_id FROM accounts LIMIT 5
    `;

    const sessionOrgId = session?.user?.orgId ?? null;

    let filteredAccounts: { id: string; name: string; org_id: string }[] = [];
    if (sessionOrgId) {
      filteredAccounts = await sql`
        SELECT id, name, org_id FROM accounts WHERE org_id = ${sessionOrgId} LIMIT 5
      `;
    }

    return NextResponse.json({
      session_org_id: sessionOrgId,
      session_user_id: session?.user?.id ?? null,
      session_email: session?.user?.email ?? null,
      all_accounts: allAccounts,
      filtered_accounts: filteredAccounts,
      match: allAccounts.length > 0 && allAccounts[0].org_id === sessionOrgId,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
