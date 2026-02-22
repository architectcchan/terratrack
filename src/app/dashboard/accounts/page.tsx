import { Suspense } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AccountsPageContent } from "@/components/accounts/accounts-page-content";
import { AccountsSkeleton } from "@/components/accounts/accounts-skeleton";

async function AccountsData() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const reps = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.orgId, session.user.orgId));

  return <AccountsPageContent reps={reps} />;
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<AccountsSkeleton />}>
      <AccountsData />
    </Suspense>
  );
}
