import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { accountChains, territories, users } from "@/db/schema";
import { CreateAccountForm } from "@/components/accounts/create-account-form";

export const metadata: Metadata = {
  title: "New Account — TerraTrack",
};

export default async function NewAccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const orgId = session.user.orgId;

  const [chains, reps, territoriesList] = await Promise.all([
    db
      .select({ id: accountChains.id, name: accountChains.name })
      .from(accountChains)
      .where(eq(accountChains.orgId, orgId))
      .orderBy(asc(accountChains.name)),

    db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(
        and(
          eq(users.orgId, orgId),
          inArray(users.role, ["sales_rep", "sales_manager"]),
          eq(users.status, "active"),
        ),
      )
      .orderBy(asc(users.firstName), asc(users.lastName)),

    db
      .select({ id: territories.id, name: territories.name })
      .from(territories)
      .where(eq(territories.orgId, orgId))
      .orderBy(asc(territories.name)),
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard/accounts"
            className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Accounts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">New Account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new dispensary to your CRM
          </p>
        </div>

        <CreateAccountForm
          chains={chains}
          reps={reps}
          territories={territoriesList}
        />
      </div>
    </div>
  );
}
