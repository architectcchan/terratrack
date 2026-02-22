"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { VisitRow } from "@/types";

const VISIT_TYPE_LABELS: Record<string, string> = {
  scheduled_meeting: "Scheduled",
  drop_in: "Drop-in",
  delivery: "Delivery",
  budtender_training: "BT Training",
  sample_drop: "Sample Drop",
  vendor_day: "Vendor Day",
  popup_event: "Popup",
  other: "Other",
};

const VISIT_TYPE_COLORS: Record<string, string> = {
  scheduled_meeting: "bg-blue-100 text-blue-700",
  drop_in: "bg-teal-100 text-teal-700",
  delivery: "bg-green-100 text-green-700",
  budtender_training: "bg-purple-100 text-purple-700",
  sample_drop: "bg-amber-100 text-amber-700",
  vendor_day: "bg-orange-100 text-orange-700",
  popup_event: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-700",
};

const OUTCOME_LABELS: Record<string, string> = {
  order_placed: "Order Placed",
  reorder_confirmed: "Reorder Confirmed",
  sample_left: "Sample Left",
  follow_up_needed: "Follow-up Needed",
  no_decision: "No Decision",
  buyer_unavailable: "Unavailable",
  declined: "Declined",
  other: "Other",
};

const OUTCOME_COLORS: Record<string, string> = {
  order_placed: "bg-emerald-100 text-emerald-700",
  reorder_confirmed: "bg-green-100 text-green-700",
  sample_left: "bg-blue-100 text-blue-700",
  follow_up_needed: "bg-amber-100 text-amber-700",
  no_decision: "bg-gray-100 text-gray-600",
  buyer_unavailable: "bg-red-50 text-red-600",
  declined: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-700",
};

const feedbackEmoji = (val: string | null, type: "general" | "pricing") => {
  if (!val) return null;
  if (type === "pricing") {
    const m: Record<string, string> = {
      fits: "✅",
      too_high: "⬆️",
      too_low: "⬇️",
    };
    return m[val];
  }
  const m: Record<string, string> = {
    positive: "😊",
    neutral: "😐",
    negative: "😞",
  };
  return m[val];
};

interface VisitsTabProps {
  accountId: string;
}

export function VisitsTab({ accountId }: VisitsTabProps) {
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchVisits = useCallback(async () => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/visits`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setVisits(data.visits);
    } catch {
      setError("Failed to load visits.");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

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
        <Link href={`/dashboard/visits/new?account=${accountId}`}>
          <Button size="sm" className="bg-[#1B4332] hover:bg-[#163728] text-white">
            <Plus className="w-4 h-4 mr-1.5" />
            Log Visit
          </Button>
        </Link>
      </div>

      {visits.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No visits recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visits.map((visit) => {
            const isExpanded = expandedId === visit.id;
            const repName =
              visit.repFirstName && visit.repLastName
                ? `${visit.repFirstName} ${visit.repLastName}`
                : "Rep";
            const contactNames =
              visit.contactsMetNames
                ?.map((c) => `${c.firstName} ${c.lastName}`)
                .join(", ") ?? "";

            return (
              <div
                key={visit.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Row header */}
                <div
                  className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : visit.id)
                  }
                >
                  <div className="flex-1 min-w-0">
                    {/* Desktop layout */}
                    <div className="hidden md:flex items-center gap-3">
                      <span className="text-sm text-gray-600 shrink-0 w-28">
                        {new Date(visit.checkInTime).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                      <span className="text-sm text-gray-700 font-medium w-28 shrink-0">
                        {repName}
                      </span>
                      {visit.visitType && (
                        <Badge
                          className={`text-xs shrink-0 ${VISIT_TYPE_COLORS[visit.visitType] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {VISIT_TYPE_LABELS[visit.visitType] ?? visit.visitType}
                        </Badge>
                      )}
                      {visit.outcome && (
                        <Badge
                          className={`text-xs shrink-0 ${OUTCOME_COLORS[visit.outcome] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {OUTCOME_LABELS[visit.outcome] ?? visit.outcome}
                        </Badge>
                      )}
                      {contactNames && (
                        <span className="text-xs text-gray-500 truncate">
                          Met: {contactNames}
                        </span>
                      )}
                      {!isExpanded && visit.notes && (
                        <span className="text-xs text-gray-400 truncate max-w-[200px]">
                          {visit.notes}
                        </span>
                      )}
                    </div>
                    {/* Mobile layout */}
                    <div className="md:hidden space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">
                          {repName}
                        </span>
                        {visit.visitType && (
                          <Badge
                            className={`text-xs ${VISIT_TYPE_COLORS[visit.visitType] ?? ""}`}
                          >
                            {VISIT_TYPE_LABELS[visit.visitType] ?? visit.visitType}
                          </Badge>
                        )}
                        {visit.outcome && (
                          <Badge
                            className={`text-xs ${OUTCOME_COLORS[visit.outcome] ?? ""}`}
                          >
                            {OUTCOME_LABELS[visit.outcome] ?? visit.outcome}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(visit.checkInTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {!isExpanded && visit.notes && (
                        <p className="text-xs text-gray-400 truncate">{visit.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4 text-sm">
                    {visit.notes && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Notes
                        </p>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {visit.notes}
                        </p>
                      </div>
                    )}

                    {(visit.buyerFeedbackLook ||
                      visit.buyerFeedbackSmell ||
                      visit.buyerFeedbackPackaging ||
                      visit.buyerFeedbackPricing) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Buyer Feedback
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            {
                              label: "Look",
                              val: visit.buyerFeedbackLook,
                              type: "general" as const,
                            },
                            {
                              label: "Smell",
                              val: visit.buyerFeedbackSmell,
                              type: "general" as const,
                            },
                            {
                              label: "Packaging",
                              val: visit.buyerFeedbackPackaging,
                              type: "general" as const,
                            },
                            {
                              label: "Pricing",
                              val: visit.buyerFeedbackPricing,
                              type: "pricing" as const,
                            },
                          ].map(
                            ({ label, val, type }) =>
                              val && (
                                <div
                                  key={label}
                                  className="bg-white rounded p-2 text-center"
                                >
                                  <p className="text-xs text-gray-400 mb-1">
                                    {label}
                                  </p>
                                  <p className="text-lg">
                                    {feedbackEmoji(val, type)}
                                  </p>
                                  <p className="text-xs text-gray-600 capitalize mt-0.5">
                                    {type === "pricing"
                                      ? val.replace("_", " ")
                                      : val}
                                  </p>
                                </div>
                              ),
                          )}
                        </div>
                      </div>
                    )}

                    {visit.shelfAvailability && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Shelf:
                        </span>
                        <span className="text-gray-700">
                          {visit.shelfAvailability === "has_opening"
                            ? "✅ Has Opening"
                            : visit.shelfAvailability === "full"
                              ? "🚫 Full"
                              : "❓ Unknown"}
                        </span>
                      </div>
                    )}

                    {visit.competitorBrandsNoted &&
                      visit.competitorBrandsNoted.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Competitors Noted
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {visit.competitorBrandsNoted.map((brand, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs"
                              >
                                {brand}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {contactNames && (
                      <div className="text-sm">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Contacts Met:
                        </span>{" "}
                        <span className="text-gray-700">{contactNames}</span>
                      </div>
                    )}

                    {visit.aiRawTranscript && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          AI Transcript
                        </p>
                        <div className="bg-white border border-gray-200 rounded p-3 text-xs text-gray-600 max-h-40 overflow-y-auto whitespace-pre-wrap">
                          {visit.aiRawTranscript}
                        </div>
                      </div>
                    )}

                    {visit.photos && visit.photos.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Photos
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {visit.photos.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Photo ${i + 1}`}
                                className="w-20 h-20 object-cover rounded border border-gray-200"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {visit.nextFollowUpDate && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Next Follow-up:</span>{" "}
                        {new Date(
                          visit.nextFollowUpDate + "T00:00:00",
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {visit.nextFollowUpNotes && (
                          <span className="ml-1">· {visit.nextFollowUpNotes}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
