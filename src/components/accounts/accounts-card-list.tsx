"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Link2, MapPin, Clock, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, TIER_CONFIG } from "@/types";
import type { AccountListItem } from "@/types";

interface AccountsCardListProps {
  accounts: AccountListItem[];
}

function formatRelative(date: string | null) {
  if (!date) return null;
  const parsed = new Date(date);
  const daysDiff = Math.floor(
    (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24),
  );
  return {
    text: formatDistanceToNow(parsed, { addSuffix: true }),
    isWarning: daysDiff > 14,
    isDanger: daysDiff > 30,
  };
}

export function AccountsCardList({ accounts }: AccountsCardListProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      {accounts.map((account) => {
        const statusCfg = STATUS_CONFIG[account.status];
        const tierCfg = TIER_CONFIG[account.revenueTier];
        const lastVisit = formatRelative(account.lastVisitDate);
        const lastOrder = formatRelative(account.lastOrderDate);

        return (
          <div
            key={account.id}
            onClick={() =>
              router.push(`/dashboard/accounts/${account.id}`)
            }
            className="cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-shadow active:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate font-medium text-foreground">
                    {account.name}
                  </h3>
                  {account.chainId && (
                    <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3" />
                  {account.city}, {account.state}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant={tierCfg.variant ?? "secondary"}
                  className={cn("text-[11px]", tierCfg.className)}
                >
                  {account.revenueTier === "unranked"
                    ? "—"
                    : account.revenueTier}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn("text-[11px]", statusCfg.className)}
                >
                  {statusCfg.label}
                </Badge>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-4 text-xs">
                {lastVisit && (
                  <div className="flex items-center gap-1">
                    <Clock className="size-3 text-muted-foreground" />
                    <span
                      className={cn(
                        lastVisit.isDanger
                          ? "font-medium text-red-500"
                          : lastVisit.isWarning
                            ? "text-muted-foreground"
                            : "text-foreground",
                      )}
                    >
                      {lastVisit.text}
                    </span>
                  </div>
                )}
                {lastOrder && (
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="size-3 text-muted-foreground" />
                    <span
                      className={cn(
                        lastOrder.isDanger
                          ? "font-medium text-red-500"
                          : lastOrder.isWarning
                            ? "text-muted-foreground"
                            : "text-foreground",
                      )}
                    >
                      {lastOrder.text}
                    </span>
                  </div>
                )}
              </div>

              {account.repFirstName && (
                <div className="flex items-center gap-1.5">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-[#1B4332] text-[9px] text-white">
                      {account.repFirstName[0]}
                      {account.repLastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {account.repFirstName}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
