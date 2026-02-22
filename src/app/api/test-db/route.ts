import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const [orgCount] = await sql`SELECT COUNT(*) as count FROM organizations`;
    const [userCount] = await sql`SELECT COUNT(*) as count FROM users`;
    const [accountCount] = await sql`SELECT COUNT(*) as count FROM accounts`;

    const orgs = await sql`SELECT id, name, slug FROM organizations LIMIT 5`;
    const users = await sql`SELECT id, email, org_id, role FROM users LIMIT 10`;
    const accounts = await sql`SELECT id, name, org_id FROM accounts LIMIT 5`;

    return NextResponse.json({
      counts: {
        organizations: Number(orgCount.count),
        users: Number(userCount.count),
        accounts: Number(accountCount.count),
      },
      organizations: orgs,
      users: users,
      accountSample: accounts,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}
