"use client";

import { differenceInDays } from "date-fns";
import type { AccountDetail } from "@/types";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  danger?: boolean;
  warning?: boolean;
}

function StatCard({ label, value, subtext, danger, warning }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 min-w-[140px] flex-1">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-2xl font-bold ${
          danger ? "text-red-600" : warning ? "text-amber-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
    </div>
  );
}

interface AccountStatsProps {
  account: AccountDetail;
}

export function AccountStats({ account }: AccountStatsProps) {
  const now = new Date();

  const daysSinceVisit = account.lastVisitDate
    ? differenceInDays(now, new Date(account.lastVisitDate))
    : null;

  const daysSinceOrder = account.lastOrderDate
    ? differenceInDays(now, new Date(account.lastOrderDate))
    : null;

  const formatCurrency = (v: string | null) => {
    if (!v) return "$0";
    const n = parseFloat(v);
    if (isNaN(n)) return "$0";
    if (n >= 1000) {
      return `$${(n / 1000).toFixed(1)}k`;
    }
    return `$${n.toFixed(0)}`;
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      <StatCard
        label="Total Revenue"
        value={formatCurrency(account.totalRevenue)}
        subtext="All paid orders"
      />
      <StatCard
        label="Orders / Month"
        value={String(account.ordersThisMonth)}
        subtext="This calendar month"
      />
      <StatCard
        label="Total Visits"
        value={String(account.totalVisits)}
        subtext={`${account.totalOrders} total orders`}
      />
      <StatCard
        label="Days Since Visit"
        value={daysSinceVisit === null ? "Never" : String(daysSinceVisit)}
        subtext={
          account.lastVisitDate
            ? new Date(account.lastVisitDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "No visits yet"
        }
        danger={daysSinceVisit !== null && daysSinceVisit > 30}
        warning={
          daysSinceVisit !== null &&
          daysSinceVisit > 14 &&
          daysSinceVisit <= 30
        }
      />
      <StatCard
        label="Days Since Order"
        value={daysSinceOrder === null ? "Never" : String(daysSinceOrder)}
        subtext={
          account.lastOrderDate
            ? new Date(account.lastOrderDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "No orders yet"
        }
        danger={daysSinceOrder !== null && daysSinceOrder > 60}
        warning={
          daysSinceOrder !== null &&
          daysSinceOrder > 30 &&
          daysSinceOrder <= 60
        }
      />
      <StatCard
        label="Avg Order Value"
        value={formatCurrency(account.avgOrderValue)}
        subtext="Excl. lost/cancelled"
      />
    </div>
  );
}
