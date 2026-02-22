"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ArrowUp, ArrowDown, Link2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, TIER_CONFIG } from "@/types";
import type { AccountListItem } from "@/types";

interface AccountsTableProps {
  accounts: AccountListItem[];
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
}

const SORTABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "city", label: "City" },
  { key: "status", label: "Status" },
  { key: "revenueTier", label: "Tier" },
  { key: "lastVisitDate", label: "Last Visit" },
  { key: "lastOrderDate", label: "Last Order" },
] as const;

function RelativeDate({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted-foreground">—</span>;

  const parsed = new Date(date);
  const daysDiff = Math.floor(
    (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24),
  );
  const text = formatDistanceToNow(parsed, { addSuffix: true });

  return (
    <span
      className={cn(
        "text-sm",
        daysDiff > 30
          ? "font-medium text-red-500"
          : daysDiff > 14
            ? "text-muted-foreground"
            : "text-foreground",
      )}
    >
      {text}
    </span>
  );
}

export function AccountsTable({
  accounts,
  sortBy,
  sortOrder,
  onSort,
}: AccountsTableProps) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {SORTABLE_COLUMNS.map((col) => (
            <TableHead key={col.key} className={col.key === "name" ? "min-w-[200px]" : ""}>
              <button
                onClick={() => onSort(col.key)}
                className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-foreground"
              >
                {col.label}
                {sortBy === col.key &&
                  (sortOrder === "asc" ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  ))}
              </button>
            </TableHead>
          ))}
          <TableHead className="text-xs font-medium">Rep</TableHead>
          <TableHead className="text-xs font-medium">Tags</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => {
          const statusCfg = STATUS_CONFIG[account.status];
          const tierCfg = TIER_CONFIG[account.revenueTier];

          return (
            <TableRow
              key={account.id}
              className="cursor-pointer"
              onClick={() =>
                router.push(`/dashboard/accounts/${account.id}`)
              }
            >
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">
                    {account.name}
                  </span>
                  {account.chainId && (
                    <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                </div>
              </TableCell>

              <TableCell className="text-muted-foreground">
                {account.city}
              </TableCell>

              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("text-[11px]", statusCfg.className)}
                >
                  {statusCfg.label}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge
                  variant={tierCfg.variant ?? "secondary"}
                  className={cn("text-[11px]", tierCfg.className)}
                >
                  {account.revenueTier === "unranked"
                    ? "—"
                    : account.revenueTier}
                </Badge>
              </TableCell>

              <TableCell>
                <RelativeDate date={account.lastVisitDate} />
              </TableCell>

              <TableCell>
                <RelativeDate date={account.lastOrderDate} />
              </TableCell>

              <TableCell>
                {account.repFirstName ? (
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback className="bg-[#1B4332] text-[10px] text-white">
                        {account.repFirstName[0]}
                        {account.repLastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {account.repFirstName}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Unassigned
                  </span>
                )}
              </TableCell>

              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {account.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
