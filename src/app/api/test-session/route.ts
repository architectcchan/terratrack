import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ session: null, message: "No session found" });
    }

    return NextResponse.json({
      session: {
        user: session.user,
      },
      hasOrgId: !!session.user?.orgId,
      orgId: session.user?.orgId ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}
