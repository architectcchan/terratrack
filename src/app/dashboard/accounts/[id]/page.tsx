import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { accounts, users, accountChains } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountDetailClient } from "@/components/accounts/account-detail-client";
import type { AccountDetail } from "@/types";

async function AccountDetailData({ id }: { id: string }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orgId = session.user.orgId;

  const [account] = await db
    .select({
      id: accounts.id,
      orgId: accounts.orgId,
      name: accounts.name,
      dbaName: accounts.dbaName,
      addressLine1: accounts.addressLine1,
      addressLine2: accounts.addressLine2,
      city: accounts.city,
      state: accounts.state,
      zip: accounts.zip,
      latitude: accounts.latitude,
      longitude: accounts.longitude,
      phone: accounts.phone,
      email: accounts.email,
      website: accounts.website,
      licenseNumber: accounts.licenseNumber,
      licenseType: accounts.licenseType,
      licenseExpiration: accounts.licenseExpiration,
      status: accounts.status,
      revenueTier: accounts.revenueTier,
      chainId: accounts.chainId,
      chainName: accountChains.name,
      chainStoreCount: accountChains.storeCount,
      assignedRepId: accounts.assignedRepId,
      repFirstName: users.firstName,
      repLastName: users.lastName,
      repAvatarUrl: users.avatarUrl,
      paymentTerms: accounts.paymentTerms,
      notes: accounts.notes,
      tags: accounts.tags,
      googlePlaceId: accounts.googlePlaceId,
      createdAt: accounts.createdAt,
      updatedAt: accounts.updatedAt,
      totalRevenue: sql<string>`COALESCE((
        SELECT SUM(o.total)::text
        FROM orders o
        WHERE o.account_id = ${accounts.id}
          AND o.org_id = ${orgId}
          AND o.payment_status = 'paid'
      ), '0')`,
      ordersThisMonth: sql<number>`(
        SELECT COUNT(*)::int
        FROM orders o
        WHERE o.account_id = ${accounts.id}
          AND o.org_id = ${orgId}
          AND o.created_at >= date_trunc('month', now())
      )`,
      totalVisits: sql<number>`(
        SELECT COUNT(*)::int
        FROM visits v
        WHERE v.account_id = ${accounts.id}
          AND v.org_id = ${orgId}
      )`,
      totalOrders: sql<number>`(
        SELECT COUNT(*)::int
        FROM orders o
        WHERE o.account_id = ${accounts.id}
          AND o.org_id = ${orgId}
      )`,
      lastVisitDate: sql<string | null>`(
        SELECT MAX(v.check_in_time)::text
        FROM visits v
        WHERE v.account_id = ${accounts.id}
          AND v.org_id = ${orgId}
      )`,
      lastOrderDate: sql<string | null>`(
        SELECT MAX(o.created_at)::text
        FROM orders o
        WHERE o.account_id = ${accounts.id}
          AND o.org_id = ${orgId}
      )`,
      avgOrderValue: sql<string>`COALESCE((
        SELECT AVG(o.total)::text
        FROM orders o
        WHERE o.account_id = ${accounts.id}
          AND o.org_id = ${orgId}
          AND o.stage NOT IN ('lost', 'cancelled')
      ), '0')`,
    })
    .from(accounts)
    .leftJoin(users, eq(accounts.assignedRepId, users.id))
    .leftJoin(accountChains, eq(accounts.chainId, accountChains.id))
    .where(and(eq(accounts.id, id), eq(accounts.orgId, orgId)));

  if (!account) notFound();

  const reps = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(and(eq(users.orgId, orgId)));

  return (
    <AccountDetailClient
      initialAccount={account as unknown as AccountDetail}
      reps={reps}
      currentUserId={session.user.id}
    />
  );
}

function AccountDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-md" />
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Stats skeleton */}
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-20 flex-1 rounded-lg" />
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<AccountDetailSkeleton />}>
      <AccountDetailData id={id} />
    </Suspense>
  );
}
