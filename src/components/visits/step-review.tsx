"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, CheckCircle2, Loader2 } from "lucide-react";
import {
  VISIT_TYPES,
  VISIT_OUTCOMES,
  CONTACT_ROLES,
  type VisitFormData,
} from "./visit-log-types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface StepReviewProps {
  formData: VisitFormData;
  submitting: boolean;
  submitted: boolean;
  onEdit: (step: number) => void;
  onSubmit: () => void;
}

export function StepReview({
  formData,
  submitting,
  submitted,
  onEdit,
  onSubmit,
}: StepReviewProps) {
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Visit Logged!
        </h3>
        <p className="text-sm text-gray-500">Redirecting to account...</p>
      </div>
    );
  }

  const visitTypeConfig = VISIT_TYPES.find(
    (v) => v.value === formData.visitType
  );
  const outcomeConfig = VISIT_OUTCOMES.find(
    (o) => o.value === formData.outcome
  );
  const contactNames = Object.values(formData.contactsMetNames);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3">
        <ReviewSection label="Account" onEdit={() => onEdit(0)}>
          <p className="text-sm font-medium text-gray-900">
            {formData.accountName}
          </p>
        </ReviewSection>

        <ReviewSection label="Visit Type" onEdit={() => onEdit(1)}>
          {visitTypeConfig && (
            <p className="text-sm text-gray-900">
              {visitTypeConfig.emoji} {visitTypeConfig.label}
            </p>
          )}
        </ReviewSection>

        <ReviewSection label="Contacts Met" onEdit={() => onEdit(2)}>
          {formData.noOneAvailable ? (
            <p className="text-sm text-gray-500 italic">No one available</p>
          ) : contactNames.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {contactNames.map((name, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">None selected</p>
          )}
        </ReviewSection>

        <ReviewSection label="Outcome" onEdit={() => onEdit(3)}>
          {outcomeConfig && (
            <p className="text-sm text-gray-900">
              {outcomeConfig.emoji} {outcomeConfig.label}
            </p>
          )}
        </ReviewSection>

        {formData.sampleData &&
          formData.sampleData.products.length > 0 && (
            <ReviewSection label="Samples" onEdit={() => onEdit(3)}>
              <div className="space-y-1">
                {formData.sampleData.products.map((sp, i) => (
                  <p key={i} className="text-sm text-gray-700">
                    {sp.productName} × {sp.quantity}
                  </p>
                ))}
                {formData.sampleData.recipientName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Recipient: {formData.sampleData.recipientName}
                  </p>
                )}
              </div>
            </ReviewSection>
          )}

        {(formData.feedbackLook ||
          formData.feedbackSmell ||
          formData.feedbackPackaging ||
          formData.feedbackPricing ||
          formData.shelfAvailability) && (
          <ReviewSection label="Feedback" onEdit={() => onEdit(3)}>
            <div className="flex flex-wrap gap-2 text-sm">
              {formData.feedbackLook && (
                <FeedbackChip
                  label="Look"
                  value={formData.feedbackLook}
                />
              )}
              {formData.feedbackSmell && (
                <FeedbackChip
                  label="Smell"
                  value={formData.feedbackSmell}
                />
              )}
              {formData.feedbackPackaging && (
                <FeedbackChip
                  label="Packaging"
                  value={formData.feedbackPackaging}
                />
              )}
              {formData.feedbackPricing && (
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
                  Pricing:{" "}
                  {formData.feedbackPricing === "fits"
                    ? "✅"
                    : formData.feedbackPricing === "too_high"
                      ? "⬆️"
                      : "⬇️"}
                </span>
              )}
              {formData.shelfAvailability && (
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
                  Shelf:{" "}
                  {formData.shelfAvailability === "has_opening"
                    ? "🟢"
                    : formData.shelfAvailability === "full"
                      ? "🔴"
                      : "❓"}
                </span>
              )}
            </div>
          </ReviewSection>
        )}

        {formData.competitorBrands.length > 0 && (
          <ReviewSection label="Competitors" onEdit={() => onEdit(3)}>
            <div className="flex flex-wrap gap-1.5">
              {formData.competitorBrands.map((b) => (
                <Badge key={b} variant="outline" className="text-xs">
                  {b}
                </Badge>
              ))}
            </div>
          </ReviewSection>
        )}

        {formData.notes && (
          <ReviewSection label="Notes" onEdit={() => onEdit(4)}>
            <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
              {formData.notes}
            </p>
          </ReviewSection>
        )}

        {formData.voiceNoteDuration && (
          <ReviewSection label="Voice Note" onEdit={() => onEdit(4)}>
            <p className="text-sm text-gray-700">
              🎤{" "}
              {Math.floor(formData.voiceNoteDuration / 60)}:
              {String(formData.voiceNoteDuration % 60).padStart(2, "0")}
            </p>
          </ReviewSection>
        )}

        {formData.productsDiscussed.length > 0 && (
          <ReviewSection label="Products Discussed" onEdit={() => onEdit(4)}>
            <div className="flex flex-wrap gap-1.5">
              {formData.productsDiscussed.map((p) => (
                <Badge key={p.id} variant="secondary" className="text-xs">
                  {p.name}
                </Badge>
              ))}
            </div>
          </ReviewSection>
        )}

        {formData.followUpDate && (
          <ReviewSection label="Follow-up" onEdit={() => onEdit(4)}>
            <p className="text-sm text-gray-700">
              📅 {format(new Date(formData.followUpDate + "T12:00:00"), "MMM d, yyyy")}
            </p>
            {formData.followUpNote && (
              <p className="text-xs text-gray-500 mt-0.5">
                {formData.followUpNote}
              </p>
            )}
          </ReviewSection>
        )}

        {formData.checkInLat && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1">
            📍 GPS: {formData.checkInLat}, {formData.checkInLng}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <Button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full h-12 bg-[#D4A843] hover:bg-[#D4A843]/90 text-white text-base font-semibold disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Visit"
          )}
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        {children}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 self-start p-1.5 rounded-md hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function FeedbackChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const emoji =
    value === "positive" ? "👍" : value === "neutral" ? "👊" : "👎";
  return (
    <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
      {label}: {emoji}
    </span>
  );
}
