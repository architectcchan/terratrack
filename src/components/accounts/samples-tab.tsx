"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SampleRow } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  delivered: "Delivered",
  awaiting_feedback: "Awaiting Feedback",
  feedback_received: "Feedback Received",
  converted_to_order: "Converted",
  declined: "Declined",
  expired: "Expired",
};

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-blue-100 text-blue-700",
  awaiting_feedback: "bg-amber-100 text-amber-700",
  feedback_received: "bg-green-100 text-green-700",
  converted_to_order: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};

function getDueDaysBadge(feedbackDueDate: string | null) {
  if (!feedbackDueDate) return null;
  const days = differenceInDays(
    new Date(feedbackDueDate + "T00:00:00"),
    new Date(),
  );
  const label =
    days < 0
      ? `${Math.abs(days)}d overdue`
      : days === 0
        ? "Due today"
        : `${days}d left`;
  const color =
    days < 0 || days < 7
      ? "text-red-600"
      : days < 14
        ? "text-amber-600"
        : "text-emerald-600";

  return <span className={`text-xs font-medium ${color}`}>{label}</span>;
}

interface SamplesTabProps {
  accountId: string;
  onDropSample: () => void;
}

export function SamplesTab({ accountId, onDropSample }: SamplesTabProps) {
  const [samples, setSamples] = useState<SampleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSamples = useCallback(async () => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/samples`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSamples(data.samples);
    } catch {
      setError("Failed to load samples.");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          className="bg-[#1B4332] hover:bg-[#163728] text-white"
          onClick={onDropSample}
        >
          Drop Sample
        </Button>
      </div>

      {samples.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No samples dropped yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Drop Date</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Products</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Recipient</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Status</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Feedback Due</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Days Until Due</th>
                  <th className="text-right font-medium text-gray-500 pb-2">Follow-ups</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((sample) => {
                  const isExpanded = expandedId === sample.id;
                  const products = Array.isArray(sample.productsSampled)
                    ? (sample.productsSampled as Array<{
                        productName: string;
                        quantity: number;
                        unitSize?: string;
                      }>)
                    : [];
                  const recipientName =
                    sample.recipientFirstName && sample.recipientLastName
                      ? `${sample.recipientFirstName} ${sample.recipientLastName}`
                      : null;

                  return (
                    <>
                      <tr
                        key={sample.id}
                        className="border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : sample.id)
                        }
                      >
                        <td className="py-3 pr-4 text-gray-600">
                          {new Date(
                            sample.droppedOffDate + "T00:00:00",
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 pr-4 text-gray-700 max-w-[180px]">
                          {products.length > 0 ? (
                            <span className="truncate block">
                              {products
                                .slice(0, 2)
                                .map(
                                  (p) =>
                                    `${p.productName}${p.unitSize ? ` (${p.unitSize})` : ""}`,
                                )
                                .join(", ")}
                              {products.length > 2 && ` +${products.length - 2}`}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-gray-600">
                          {recipientName ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            className={`text-xs ${STATUS_COLORS[sample.status] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {STATUS_LABELS[sample.status] ?? sample.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-gray-600 text-xs">
                          {sample.feedbackDueDate
                            ? new Date(
                                sample.feedbackDueDate + "T00:00:00",
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 pr-4">
                          {getDueDaysBadge(sample.feedbackDueDate)}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {sample.followUpCount ?? 0}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${sample.id}-expand`} className="bg-gray-50">
                          <td colSpan={7} className="px-4 py-3 space-y-3">
                            {products.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Products
                                </p>
                                <div className="space-y-0.5">
                                  {products.map((p, i) => (
                                    <p key={i} className="text-xs text-gray-700">
                                      {p.productName}
                                      {p.unitSize
                                        ? ` — ${p.quantity}×${p.unitSize}`
                                        : ` ×${p.quantity}`}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                            {sample.feedbackNotes && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Feedback
                                </p>
                                <p className="text-xs text-gray-700">
                                  {sample.feedbackNotes}
                                </p>
                              </div>
                            )}
                            {sample.notes && (
                              <p className="text-xs text-gray-500">{sample.notes}</p>
                            )}
                            {sample.convertedOrderId && (
                              <p className="text-xs text-emerald-600 font-medium">
                                ✅ Converted to order
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {samples.map((sample) => {
              const isExpanded = expandedId === sample.id;
              const products = Array.isArray(sample.productsSampled)
                ? (sample.productsSampled as Array<{
                    productName: string;
                    quantity: number;
                    unitSize?: string;
                  }>)
                : [];

              return (
                <div
                  key={sample.id}
                  className="border border-gray-200 rounded-lg p-3 space-y-2 cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : sample.id)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Badge
                        className={`text-xs ${STATUS_COLORS[sample.status] ?? ""}`}
                      >
                        {STATUS_LABELS[sample.status] ?? sample.status}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        {new Date(
                          sample.droppedOffDate + "T00:00:00",
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      {getDueDaysBadge(sample.feedbackDueDate)}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-700">
                    {products
                      .slice(0, 2)
                      .map((p) => p.productName)
                      .join(", ")}
                    {products.length > 2 && ` +${products.length - 2} more`}
                  </p>
                  {isExpanded && sample.feedbackNotes && (
                    <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      {sample.feedbackNotes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
