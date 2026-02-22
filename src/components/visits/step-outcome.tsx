"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, X, Search } from "lucide-react";
import {
  VISIT_OUTCOMES,
  type VisitOutcome,
  type FeedbackValue,
  type PricingValue,
  type ShelfValue,
  type SampleFormData,
  type SampleProduct,
  type ProductOption,
  type ContactOption,
} from "./visit-log-types";
import { cn } from "@/lib/utils";

interface StepOutcomeProps {
  outcome: VisitOutcome | null;
  sampleData: SampleFormData | null;
  feedbackLook: FeedbackValue | null;
  feedbackSmell: FeedbackValue | null;
  feedbackPackaging: FeedbackValue | null;
  feedbackPricing: PricingValue | null;
  shelfAvailability: ShelfValue | null;
  competitorBrands: string[];
  contactsMet: ContactOption[];
  products: ProductOption[];
  onUpdateOutcome: (outcome: VisitOutcome) => void;
  onUpdateSampleData: (data: SampleFormData | null) => void;
  onUpdateFeedback: (
    field: string,
    value: FeedbackValue | PricingValue | ShelfValue | null
  ) => void;
  onUpdateCompetitors: (brands: string[]) => void;
  onNext: () => void;
}

export function StepOutcome({
  outcome,
  sampleData,
  feedbackLook,
  feedbackSmell,
  feedbackPackaging,
  feedbackPricing,
  shelfAvailability,
  competitorBrands,
  contactsMet,
  products,
  onUpdateOutcome,
  onUpdateSampleData,
  onUpdateFeedback,
  onUpdateCompetitors,
  onNext,
}: StepOutcomeProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [competitorInput, setCompetitorInput] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 10);
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.strainName && p.strainName.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const handleSelectOutcome = useCallback(
    (val: VisitOutcome) => {
      onUpdateOutcome(val);
      if (val === "sample_left" && !sampleData) {
        onUpdateSampleData({
          products: [],
          recipientContactId: null,
          recipientName: "",
        });
      }
      if (val !== "sample_left") {
        onUpdateSampleData(null);
      }
    },
    [onUpdateOutcome, onUpdateSampleData, sampleData]
  );

  const handleAddSampleProduct = useCallback(
    (product: ProductOption) => {
      if (!sampleData) return;
      const exists = sampleData.products.find(
        (p) => p.productId === product.id
      );
      if (exists) return;
      onUpdateSampleData({
        ...sampleData,
        products: [
          ...sampleData.products,
          {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitSize: product.unitSize,
          },
        ],
      });
      setProductSearch("");
    },
    [sampleData, onUpdateSampleData]
  );

  const handleRemoveSampleProduct = useCallback(
    (idx: number) => {
      if (!sampleData) return;
      onUpdateSampleData({
        ...sampleData,
        products: sampleData.products.filter((_, i) => i !== idx),
      });
    },
    [sampleData, onUpdateSampleData]
  );

  const handleUpdateQuantity = useCallback(
    (idx: number, qty: number) => {
      if (!sampleData) return;
      const updated: SampleProduct[] = sampleData.products.map((p, i) =>
        i === idx ? { ...p, quantity: Math.max(1, qty) } : p
      );
      onUpdateSampleData({ ...sampleData, products: updated });
    },
    [sampleData, onUpdateSampleData]
  );

  const handleAddCompetitor = useCallback(() => {
    const brand = competitorInput.trim();
    if (!brand || competitorBrands.includes(brand)) return;
    onUpdateCompetitors([...competitorBrands, brand]);
    setCompetitorInput("");
  }, [competitorInput, competitorBrands, onUpdateCompetitors]);

  return (
    <div className="flex flex-col h-full">
      <p className="text-sm text-gray-600 mb-3">What was the outcome?</p>

      <div className="flex-1 overflow-y-auto space-y-2">
        {VISIT_OUTCOMES.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => handleSelectOutcome(o.value)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all active:scale-[0.98] text-left",
              outcome === o.value
                ? "border-[#1B4332] bg-[#1B4332]/5"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <span className="text-lg">{o.emoji}</span>
            <span
              className={cn(
                "text-sm font-medium",
                outcome === o.value ? "text-[#1B4332]" : "text-gray-700"
              )}
            >
              {o.label}
            </span>
          </button>
        ))}

        {outcome === "sample_left" && sampleData && (
          <div className="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-100 space-y-3">
            <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
              Sample Details
            </p>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-8 h-9 text-sm bg-white"
              />
            </div>

            {productSearch && filteredProducts.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 max-h-[150px] overflow-y-auto">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddSampleProduct(p)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">
                      {p.unitSize}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {sampleData.products.length > 0 && (
              <div className="space-y-2">
                {sampleData.products.map((sp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200"
                  >
                    <span className="flex-1 text-sm font-medium truncate">
                      {sp.productName}
                    </span>
                    <Input
                      type="number"
                      value={sp.quantity}
                      onChange={(e) =>
                        handleUpdateQuantity(idx, parseInt(e.target.value) || 1)
                      }
                      className="w-16 h-7 text-center text-sm"
                      min={1}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSampleProduct(idx)}
                      className="text-gray-400 hover:text-red-500 p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {contactsMet.length > 0 && (
              <div>
                <p className="text-xs text-purple-700 mb-1.5 font-medium">
                  Recipient
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {contactsMet.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        onUpdateSampleData({
                          ...sampleData,
                          recipientContactId: c.id,
                          recipientName: `${c.firstName} ${c.lastName}`.trim(),
                        })
                      }
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border transition-colors",
                        sampleData.recipientContactId === c.id
                          ? "bg-purple-200 border-purple-300 text-purple-900"
                          : "bg-white border-gray-200 text-gray-600 hover:border-purple-200"
                      )}
                    >
                      {c.firstName} {c.lastName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowFeedback((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              Quick Feedback{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </span>
            {showFeedback ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {showFeedback && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              <FeedbackRow
                label="Product Look"
                value={feedbackLook}
                onChange={(v) => onUpdateFeedback("feedbackLook", v)}
              />
              <FeedbackRow
                label="Smell"
                value={feedbackSmell}
                onChange={(v) => onUpdateFeedback("feedbackSmell", v)}
              />
              <FeedbackRow
                label="Packaging"
                value={feedbackPackaging}
                onChange={(v) => onUpdateFeedback("feedbackPackaging", v)}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Pricing</span>
                <div className="flex gap-1.5">
                  {(
                    [
                      { val: "fits", label: "✅ Fits" },
                      { val: "too_high", label: "⬆️ Too High" },
                      { val: "too_low", label: "⬇️ Too Low" },
                    ] as const
                  ).map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        onUpdateFeedback(
                          "feedbackPricing",
                          feedbackPricing === val ? null : val
                        )
                      }
                      className={cn(
                        "text-xs px-2 py-1 rounded-md border transition-colors",
                        feedbackPricing === val
                          ? "bg-[#1B4332] text-white border-[#1B4332]"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Shelf Space</span>
                <div className="flex gap-1.5">
                  {(
                    [
                      { val: "has_opening", label: "🟢 Opening" },
                      { val: "full", label: "🔴 Full" },
                      { val: "unknown", label: "❓ Unknown" },
                    ] as const
                  ).map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        onUpdateFeedback(
                          "shelfAvailability",
                          shelfAvailability === val ? null : val
                        )
                      }
                      className={cn(
                        "text-xs px-2 py-1 rounded-md border transition-colors",
                        shelfAvailability === val
                          ? "bg-[#1B4332] text-white border-[#1B4332]"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCompetitors((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              Competitor Brands{" "}
              {competitorBrands.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 text-[10px] px-1.5 py-0"
                >
                  {competitorBrands.length}
                </Badge>
              )}
            </span>
            {showCompetitors ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {showCompetitors && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
              <div className="flex gap-2 mb-2">
                <Input
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCompetitor()}
                  placeholder="Type brand name, press Enter"
                  className="h-9 text-sm"
                />
              </div>
              {competitorBrands.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {competitorBrands.map((brand) => (
                    <Badge
                      key={brand}
                      variant="secondary"
                      className="text-xs pr-1 gap-1"
                    >
                      {brand}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCompetitors(
                            competitorBrands.filter((b) => b !== brand)
                          )
                        }
                        className="ml-0.5 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <Button
          onClick={onNext}
          disabled={!outcome}
          className="w-full h-11 bg-[#1B4332] hover:bg-[#1B4332]/90 text-sm font-medium disabled:opacity-40"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function FeedbackRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FeedbackValue | null;
  onChange: (v: FeedbackValue | null) => void;
}) {
  const options: { val: FeedbackValue; emoji: string }[] = [
    { val: "positive", emoji: "👍" },
    { val: "neutral", emoji: "👊" },
    { val: "negative", emoji: "👎" },
  ];

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex gap-1.5">
        {options.map(({ val, emoji }) => (
          <button
            key={val}
            type="button"
            onClick={() => onChange(value === val ? null : val)}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-lg border text-base transition-all",
              value === val
                ? "bg-[#1B4332] border-[#1B4332] scale-110"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
