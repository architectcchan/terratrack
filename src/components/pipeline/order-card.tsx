"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  type PipelineOrder,
  SOURCE_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from "@/types";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: PipelineOrder;
  onClick: () => void;
}

function getDaysInStage(stageEnteredAt: string | null, createdAt: string) {
  const enteredAt = stageEnteredAt
    ? new Date(stageEnteredAt)
    : new Date(createdAt);
  return Math.floor((Date.now() - enteredAt.getTime()) / (1000 * 60 * 60 * 24));
}

function DaysInStageBadge({ days }: { days: number }) {
  const config =
    days <= 3
      ? { cls: "bg-green-100 text-green-800", label: `${days}d` }
      : days <= 7
        ? { cls: "bg-yellow-100 text-yellow-800", label: `${days}d` }
        : { cls: "bg-red-100 text-red-800", label: `${days}d` };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium",
        config.cls,
      )}
    >
      {config.label}
    </span>
  );
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const days = getDaysInStage(order.stageEnteredAt, order.createdAt as string);
  const displayItems = order.lineItems?.slice(0, 2) ?? [];
  const remaining = (order.lineItems?.length ?? 0) - 2;
  const source = order.source ? SOURCE_CONFIG[order.source] : null;
  const paymentCfg = order.paymentStatus
    ? PAYMENT_STATUS_CONFIG[order.paymentStatus as keyof typeof PAYMENT_STATUS_CONFIG]
    : null;

  const repInitials = [order.repFirstName, order.repLastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join("");

  const closeDate = order.expectedCloseDate
    ? new Date(order.expectedCloseDate + "T00:00:00").toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" },
      )
    : null;

  const isOverdue =
    order.expectedCloseDate &&
    new Date(order.expectedCloseDate + "T00:00:00") < new Date() &&
    !["paid", "lost", "cancelled"].includes(order.stage);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-pointer hover:border-[#1B4332]/40 hover:shadow-md transition-all group"
    >
      {/* Account name */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="font-semibold text-sm text-[#1B4332] hover:underline line-clamp-1 group-hover:text-[#1B4332]"
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/dashboard/accounts/${order.accountId}`;
          }}
        >
          {order.accountName ?? "Unknown Account"}
        </span>
        <DaysInStageBadge days={days} />
      </div>

      {/* Line items */}
      <div className="mb-2 space-y-0.5">
        {displayItems.length > 0 ? (
          <>
            {displayItems.map((item, i) => (
              <p key={i} className="text-xs text-gray-500 line-clamp-1">
                {item.quantity}× {item.productName}
              </p>
            ))}
            {remaining > 0 && (
              <p className="text-xs text-gray-400">+{remaining} more</p>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400 italic">No line items</p>
        )}
      </div>

      {/* Total */}
      <div className="text-lg font-bold text-gray-900 mb-2">
        ${parseFloat(order.total ?? "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1">
          {/* Source */}
          {source && (
            <span className="text-sm" title={source.label}>
              {source.icon}
            </span>
          )}

          {/* Sample badge */}
          {order.linkedSampleId && (
            <span className="text-sm" title="Linked to sample">
              🧪
            </span>
          )}

          {/* Payment status */}
          {paymentCfg && order.paymentStatus !== "unpaid" && (
            <span
              className={cn(
                "inline-flex items-center rounded px-1.5 py-0.5 text-xs border",
                paymentCfg.className,
              )}
            >
              {paymentCfg.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Expected close date */}
          {closeDate && (
            <span
              className={cn(
                "text-xs",
                isOverdue ? "text-red-600 font-medium" : "text-gray-400",
              )}
            >
              {isOverdue ? "⚠ " : ""}
              {closeDate}
            </span>
          )}

          {/* Rep avatar */}
          {repInitials && (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px] bg-[#1B4332] text-white">
                {repInitials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
