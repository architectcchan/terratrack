"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  ShoppingCart,
  Package,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityItem } from "@/types";

const VISIT_TYPE_LABELS: Record<string, string> = {
  scheduled_meeting: "Scheduled Meeting",
  drop_in: "Drop-in",
  delivery: "Delivery",
  budtender_training: "Budtender Training",
  sample_drop: "Sample Drop",
  vendor_day: "Vendor Day",
  popup_event: "Popup Event",
  other: "Other",
};

const OUTCOME_LABELS: Record<string, string> = {
  order_placed: "Order Placed",
  reorder_confirmed: "Reorder Confirmed",
  sample_left: "Sample Left",
  follow_up_needed: "Follow-up Needed",
  no_decision: "No Decision",
  buyer_unavailable: "Buyer Unavailable",
  declined: "Declined",
  other: "Other",
};

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  quote_sent: "Quote Sent",
  confirmed: "Confirmed",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  delivered: "Delivered",
  paid: "Paid",
  lost: "Lost",
  cancelled: "Cancelled",
};

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-gray-100 text-gray-700",
  quote_sent: "bg-blue-100 text-blue-700",
  confirmed: "bg-amber-100 text-amber-700",
  processing: "bg-purple-100 text-purple-700",
  ready_for_delivery: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const SAMPLE_STATUS_COLORS: Record<string, string> = {
  delivered: "bg-blue-100 text-blue-700",
  awaiting_feedback: "bg-amber-100 text-amber-700",
  feedback_received: "bg-green-100 text-green-700",
  converted_to_order: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-500",
};

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function VisitItem({ item }: { item: Extract<ActivityItem, { type: "visit" }> }) {
  const [expanded, setExpanded] = useState(false);
  const repName =
    item.repFirstName && item.repLastName
      ? `${item.repFirstName} ${item.repLastName}`
      : "Rep";

  const feedbackEmoji = (val: string | null, type: "general" | "pricing") => {
    if (!val) return null;
    if (type === "pricing") {
      const m: Record<string, string> = {
        fits: "✅ Fits",
        too_high: "⬆️ Too High",
        too_low: "⬇️ Too Low",
      };
      return m[val] ?? val;
    }
    const m: Record<string, string> = {
      positive: "😊 Positive",
      neutral: "😐 Neutral",
      negative: "😞 Negative",
    };
    return m[val] ?? val;
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-blue-600" />
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {repName} visited
              {item.visitType && (
                <span className="font-normal text-gray-500">
                  {" "}
                  — {VISIT_TYPE_LABELS[item.visitType] ?? item.visitType}
                </span>
              )}
              {item.outcome && (
                <span className="font-normal text-gray-500">
                  {" "}
                  — {OUTCOME_LABELS[item.outcome] ?? item.outcome}
                </span>
              )}
            </p>
            {item.notes && !expanded && (
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">
                {item.notes}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400">{formatTime(item.timestamp)}</span>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-3 bg-gray-50 rounded-md p-3 text-sm">
            {item.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Notes
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">{item.notes}</p>
              </div>
            )}
            {(item.buyerFeedbackLook ||
              item.buyerFeedbackSmell ||
              item.buyerFeedbackPackaging ||
              item.buyerFeedbackPricing) && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Buyer Feedback
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {item.buyerFeedbackLook && (
                    <div>
                      <span className="text-gray-500">Look: </span>
                      {feedbackEmoji(item.buyerFeedbackLook, "general")}
                    </div>
                  )}
                  {item.buyerFeedbackSmell && (
                    <div>
                      <span className="text-gray-500">Smell: </span>
                      {feedbackEmoji(item.buyerFeedbackSmell, "general")}
                    </div>
                  )}
                  {item.buyerFeedbackPackaging && (
                    <div>
                      <span className="text-gray-500">Packaging: </span>
                      {feedbackEmoji(item.buyerFeedbackPackaging, "general")}
                    </div>
                  )}
                  {item.buyerFeedbackPricing && (
                    <div>
                      <span className="text-gray-500">Pricing: </span>
                      {feedbackEmoji(item.buyerFeedbackPricing, "pricing")}
                    </div>
                  )}
                </div>
              </div>
            )}
            {item.shelfAvailability && (
              <div className="text-xs">
                <span className="text-gray-500">Shelf: </span>
                <span className="text-gray-700">
                  {item.shelfAvailability === "has_opening"
                    ? "Has Opening"
                    : item.shelfAvailability === "full"
                      ? "Full"
                      : "Unknown"}
                </span>
              </div>
            )}
            {item.competitorBrandsNoted && item.competitorBrandsNoted.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Competitors Noted
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.competitorBrandsNoted.map((brand, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs py-0"
                    >
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {item.aiRawTranscript && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  AI Transcript
                </p>
                <p className="text-gray-600 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {item.aiRawTranscript}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderItem({ item }: { item: Extract<ActivityItem, { type: "order" }> }) {
  const [expanded, setExpanded] = useState(false);
  const repName =
    item.repFirstName && item.repLastName
      ? `${item.repFirstName} ${item.repLastName}`
      : "Rep";

  const total = parseFloat(item.total);
  const totalStr = isNaN(total) ? "$0" : `$${total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <ShoppingCart className="w-4 h-4 text-green-600" />
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {repName} created {totalStr} order
              <span className="ml-1.5">
                <Badge
                  className={`text-xs py-0 ${STAGE_COLORS[item.stage] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {STAGE_LABELS[item.stage] ?? item.stage}
                </Badge>
              </span>
            </p>
            {item.lineItemsSummary && item.lineItemsSummary.length > 0 && !expanded && (
              <p className="text-xs text-gray-500 mt-0.5">
                {item.lineItemsSummary
                  .slice(0, 2)
                  .map((li) => `${li.productName} ×${li.quantity}`)
                  .join(", ")}
                {item.lineItemsSummary.length > 2 &&
                  ` and ${item.lineItemsSummary.length - 2} more`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400">{formatTime(item.timestamp)}</span>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {expanded && item.lineItemsSummary && (
          <div className="mt-3 bg-gray-50 rounded-md p-3 text-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Line Items
            </p>
            <div className="space-y-1">
              {item.lineItemsSummary.map((li, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-700">
                  <span>
                    {li.productName} ×{li.quantity}
                  </span>
                </div>
              ))}
            </div>
            {item.notes && (
              <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                {item.notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SampleItem({ item }: { item: Extract<ActivityItem, { type: "sample" }> }) {
  const [expanded, setExpanded] = useState(false);
  const repName =
    item.repFirstName && item.repLastName
      ? `${item.repFirstName} ${item.repLastName}`
      : "Rep";

  const products = Array.isArray(item.productsSampled)
    ? (item.productsSampled as Array<{ productName: string; quantity: number; unitSize?: string }>)
    : [];

  const productSummary = products
    .slice(0, 2)
    .map(
      (p) =>
        `${p.productName}${p.unitSize ? ` (${p.quantity}×${p.unitSize})` : ` ×${p.quantity}`}`,
    )
    .join(", ");

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-amber-600" />
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {repName} dropped samples
              <span className="ml-1.5">
                <Badge
                  className={`text-xs py-0 ${SAMPLE_STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {item.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
              </span>
            </p>
            {products.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {productSummary}
                {products.length > 2 && ` and ${products.length - 2} more`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400">{formatTime(item.timestamp)}</span>
            {(item.feedbackNotes || products.length > 2) && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-gray-400 hover:text-gray-600"
              >
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 bg-gray-50 rounded-md p-3 text-sm space-y-2">
            <div className="space-y-1">
              {products.map((p, i) => (
                <p key={i} className="text-xs text-gray-700">
                  {p.productName}
                  {p.unitSize ? ` — ${p.quantity}×${p.unitSize}` : ` ×${p.quantity}`}
                </p>
              ))}
            </div>
            {item.feedbackNotes && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Feedback
                </p>
                <p className="text-xs text-gray-700">{item.feedbackNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskItem({ item }: { item: Extract<ActivityItem, { type: "task" }> }) {
  const repName =
    item.repFirstName && item.repLastName
      ? `${item.repFirstName} ${item.repLastName}`
      : "Rep";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
          <CheckSquare className="w-4 h-4 text-purple-600" />
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {item.title}
              <span className="ml-1.5">
                <Badge
                  className={`text-xs py-0 ${TASK_STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {item.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Assigned to {repName} · Due{" "}
              {new Date(item.dueDate + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <span className="text-xs text-gray-400 shrink-0">{formatTime(item.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

interface ActivityTimelineProps {
  accountId: string;
}

export function ActivityTimeline({ accountId }: ActivityTimelineProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchActivity = useCallback(
    async (offset: number, append: boolean) => {
      try {
        const res = await fetch(
          `/api/accounts/${accountId}/activity?offset=${offset}`,
        );
        if (!res.ok) throw new Error("Failed to load activity");
        const data = await res.json();
        if (append) {
          setItems((prev) => [...prev, ...data.activity]);
        } else {
          setItems(data.activity);
        }
        setTotal(data.total);
        setHasMore(data.hasMore);
      } catch {
        setError("Failed to load activity.");
      }
    },
    [accountId],
  );

  useEffect(() => {
    setLoading(true);
    fetchActivity(0, false).finally(() => setLoading(false));
  }, [fetchActivity]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchActivity(items.length, true);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">No activity recorded yet.</p>
        <p className="text-xs mt-1">
          Log a visit, create an order, or drop a sample to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">{total} total activities</p>
      <div>
        {items.map((item) => {
          if (item.type === "visit") return <VisitItem key={`v-${item.id}`} item={item} />;
          if (item.type === "order") return <OrderItem key={`o-${item.id}`} item={item} />;
          if (item.type === "sample") return <SampleItem key={`s-${item.id}`} item={item} />;
          if (item.type === "task") return <TaskItem key={`t-${item.id}`} item={item} />;
          return null;
        })}
      </div>
      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full mt-2"
        >
          {loadingMore ? "Loading..." : "Load More"}
        </Button>
      )}
    </div>
  );
}
