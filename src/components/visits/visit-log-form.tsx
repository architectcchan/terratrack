"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StepSelectAccount } from "./step-select-account";
import { StepVisitType } from "./step-visit-type";
import { StepContacts } from "./step-contacts";
import { StepOutcome } from "./step-outcome";
import { StepNotes } from "./step-notes";
import { StepReview } from "./step-review";
import {
  getInitialFormData,
  type VisitFormData,
  type VisitType,
  type VisitOutcome,
  type FeedbackValue,
  type PricingValue,
  type ShelfValue,
  type AccountOption,
  type ContactOption,
  type ProductOption,
} from "./visit-log-types";
import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "Account",
  "Visit Type",
  "Contacts",
  "Outcome",
  "Notes",
  "Review",
];

export function VisitLogForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAccountId = searchParams.get("account");

  const [step, setStep] = useState(preselectedAccountId ? 1 : 0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [formData, setFormData] = useState<VisitFormData>(getInitialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [recentAccounts, setRecentAccounts] = useState<AccountOption[]>([]);
  const [allAccounts, setAllAccounts] = useState<AccountOption[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [accountSearchQuery, setAccountSearchQuery] = useState("");

  const dataFetchedRef = useRef(false);
  const contactsFetchedForRef = useRef<string>("");

  useEffect(() => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    const fetchInitial = async () => {
      const [accountsRes, productsRes, recentRes] = await Promise.all([
        fetch("/api/accounts?limit=100"),
        fetch("/api/products?status=active"),
        fetch("/api/visits?recent_for_rep=me"),
      ]);

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        const mapped: AccountOption[] = data.accounts.map(
          (a: { id: string; name: string; city: string; status: string; lastVisitDate: string | null }) => ({
            id: a.id,
            name: a.name,
            city: a.city,
            status: a.status,
            lastVisitDate: a.lastVisitDate,
          })
        );
        setAllAccounts(mapped);

        if (preselectedAccountId) {
          const match = mapped.find((a) => a.id === preselectedAccountId);
          if (match) {
            setFormData((prev) => ({
              ...prev,
              accountId: match.id,
              accountName: match.name,
            }));
            fetchContacts(match.id);
          }
        }
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products);
      }

      if (recentRes.ok) {
        const data = await recentRes.json();
        if (data.recentAccounts) {
          setRecentAccounts(
            data.recentAccounts.map(
              (r: { accountId: string; accountName: string; city: string; status: string; lastVisitDate: string }) => ({
                id: r.accountId,
                name: r.accountName,
                city: r.city,
                status: r.status,
                lastVisitDate: r.lastVisitDate,
              })
            )
          );
        }
      }
    };

    fetchInitial();
  }, [preselectedAccountId]);

  const fetchContacts = useCallback(async (accountId: string) => {
    if (contactsFetchedForRef.current === accountId) return;
    contactsFetchedForRef.current = accountId;
    const res = await fetch(`/api/accounts/${accountId}/contacts`);
    if (res.ok) {
      const data = await res.json();
      setContacts(data.contacts);
    }
  }, []);

  const filteredAccounts = useMemo(() => {
    if (!accountSearchQuery.trim()) return allAccounts;
    const q = accountSearchQuery.toLowerCase();
    return allAccounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q)
    );
  }, [allAccounts, accountSearchQuery]);

  const goForward = useCallback((targetStep?: number) => {
    setDirection("forward");
    setStep((s) => targetStep ?? s + 1);
  }, []);

  const goBack = useCallback(() => {
    if (step === 0) {
      router.back();
      return;
    }
    setDirection("back");
    setStep((s) => s - 1);
  }, [step, router]);

  const goToStep = useCallback((target: number) => {
    setDirection(target > step ? "forward" : "back");
    setStep(target);
  }, [step]);

  const handleSelectAccount = useCallback(
    (account: AccountOption) => {
      setFormData((prev) => ({
        ...prev,
        accountId: account.id,
        accountName: account.name,
      }));
      fetchContacts(account.id);
      goForward(1);
    },
    [fetchContacts, goForward]
  );

  const handleSelectVisitType = useCallback(
    (type: VisitType) => {
      setFormData((prev) => ({ ...prev, visitType: type }));
      goForward(2);
    },
    [goForward]
  );

  const handleGpsCapture = useCallback((lat: string, lng: string) => {
    setFormData((prev) => ({ ...prev, checkInLat: lat, checkInLng: lng }));
  }, []);

  const handleToggleContact = useCallback(
    (id: string, name: string) => {
      setFormData((prev) => {
        const has = prev.contactsMet.includes(id);
        const contactsMet = has
          ? prev.contactsMet.filter((c) => c !== id)
          : [...prev.contactsMet, id];
        const contactsMetNames = { ...prev.contactsMetNames };
        if (has) {
          delete contactsMetNames[id];
        } else {
          contactsMetNames[id] = name;
        }
        return { ...prev, contactsMet, contactsMetNames, noOneAvailable: false };
      });
    },
    []
  );

  const handleToggleNoOne = useCallback((val: boolean) => {
    setFormData((prev) => ({
      ...prev,
      noOneAvailable: val,
      contactsMet: val ? [] : prev.contactsMet,
      contactsMetNames: val ? {} : prev.contactsMetNames,
    }));
  }, []);

  const handleAddContact = useCallback((contact: ContactOption) => {
    setContacts((prev) => [...prev, contact]);
  }, []);

  const handleUpdateOutcome = useCallback((outcome: VisitOutcome) => {
    setFormData((prev) => ({
      ...prev,
      outcome: prev.outcome === outcome ? null : outcome,
    }));
  }, []);

  const handleUpdateSampleData = useCallback(
    (data: VisitFormData["sampleData"]) => {
      setFormData((prev) => ({ ...prev, sampleData: data }));
    },
    []
  );

  const handleUpdateFeedback = useCallback(
    (field: string, value: FeedbackValue | PricingValue | ShelfValue | null) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleUpdateCompetitors = useCallback((brands: string[]) => {
    setFormData((prev) => ({ ...prev, competitorBrands: brands }));
  }, []);

  const handleUpdateNotes = useCallback((notes: string) => {
    setFormData((prev) => ({ ...prev, notes }));
  }, []);

  const handleUpdateVoiceNote = useCallback(
    (duration: number | null, blob: Blob | null) => {
      setFormData((prev) => ({
        ...prev,
        voiceNoteDuration: duration,
        voiceNoteBlob: blob,
      }));
    },
    []
  );

  const handleUpdateProductsDiscussed = useCallback(
    (prods: ProductOption[]) => {
      setFormData((prev) => ({ ...prev, productsDiscussed: prods }));
    },
    []
  );

  const handleUpdateFollowUp = useCallback(
    (date: string | null, note: string) => {
      setFormData((prev) => ({
        ...prev,
        followUpDate: date,
        followUpNote: note,
      }));
    },
    []
  );

  const contactsForOutcome = useMemo(
    () => contacts.filter((c) => formData.contactsMet.includes(c.id)),
    [contacts, formData.contactsMet]
  );

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const payload = {
        accountId: formData.accountId,
        visitType: formData.visitType,
        outcome: formData.outcome,
        contactsMet:
          formData.contactsMet.length > 0 ? formData.contactsMet : null,
        productsDiscussed:
          formData.productsDiscussed.length > 0
            ? formData.productsDiscussed.map((p) => p.id)
            : null,
        notes: formData.notes || null,
        checkInLat: formData.checkInLat,
        checkInLng: formData.checkInLng,
        nextFollowUpDate: formData.followUpDate,
        nextFollowUpNotes: formData.followUpNote || null,
        buyerFeedbackLook: formData.feedbackLook,
        buyerFeedbackSmell: formData.feedbackSmell,
        buyerFeedbackPackaging: formData.feedbackPackaging,
        buyerFeedbackPricing: formData.feedbackPricing,
        shelfAvailability: formData.shelfAvailability,
        competitorBrandsNoted:
          formData.competitorBrands.length > 0
            ? formData.competitorBrands
            : null,
        voiceNoteDuration: formData.voiceNoteDuration,
        sampleData:
          formData.sampleData && formData.sampleData.products.length > 0
            ? {
                productsSampled: formData.sampleData.products.map((p) => ({
                  productId: p.productId,
                  productName: p.productName,
                  quantity: p.quantity,
                  unitSize: p.unitSize,
                })),
                recipientContactId: formData.sampleData.recipientContactId,
                recipientName: formData.sampleData.recipientName,
              }
            : null,
      };

      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          router.push(`/dashboard/accounts/${formData.accountId}`);
        }, 1500);
      } else {
        setSubmitting(false);
      }
    } catch {
      setSubmitting(false);
    }
  }, [formData, submitting, router]);

  const handleAccountSearch = useCallback((query: string) => {
    setAccountSearchQuery(query);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] w-full max-w-2xl mx-auto">
      <div className="shrink-0 flex items-center gap-3 pb-3 border-b border-gray-100">
        <button
          type="button"
          onClick={goBack}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">
              Step {step + 1} of 6
            </span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">
              {STEP_LABELS[step]}
            </span>
          </div>
          <div className="flex gap-1 mt-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i <= step ? "bg-[#1B4332]" : "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 pt-4 overflow-hidden relative">
        <div
          key={step}
          className={cn(
            "h-full animate-in duration-200 fill-mode-both",
            direction === "forward"
              ? "slide-in-from-right-4 fade-in"
              : "slide-in-from-left-4 fade-in"
          )}
        >
          {step === 0 && (
            <StepSelectAccount
              recentAccounts={recentAccounts}
              allAccounts={filteredAccounts}
              onSelect={handleSelectAccount}
              onSearch={handleAccountSearch}
              searchQuery={accountSearchQuery}
            />
          )}
          {step === 1 && (
            <StepVisitType
              selected={formData.visitType}
              onSelect={handleSelectVisitType}
              onGpsCapture={handleGpsCapture}
            />
          )}
          {step === 2 && (
            <StepContacts
              contacts={contacts}
              selectedIds={formData.contactsMet}
              noOneAvailable={formData.noOneAvailable}
              accountId={formData.accountId}
              onToggleContact={handleToggleContact}
              onToggleNoOne={handleToggleNoOne}
              onAddContact={handleAddContact}
              onNext={() => goForward()}
            />
          )}
          {step === 3 && (
            <StepOutcome
              outcome={formData.outcome}
              sampleData={formData.sampleData}
              feedbackLook={formData.feedbackLook}
              feedbackSmell={formData.feedbackSmell}
              feedbackPackaging={formData.feedbackPackaging}
              feedbackPricing={formData.feedbackPricing}
              shelfAvailability={formData.shelfAvailability}
              competitorBrands={formData.competitorBrands}
              contactsMet={contactsForOutcome}
              products={products}
              onUpdateOutcome={handleUpdateOutcome}
              onUpdateSampleData={handleUpdateSampleData}
              onUpdateFeedback={handleUpdateFeedback}
              onUpdateCompetitors={handleUpdateCompetitors}
              onNext={() => goForward()}
            />
          )}
          {step === 4 && (
            <StepNotes
              notes={formData.notes}
              voiceNoteDuration={formData.voiceNoteDuration}
              voiceNoteBlob={formData.voiceNoteBlob}
              productsDiscussed={formData.productsDiscussed}
              followUpDate={formData.followUpDate}
              followUpNote={formData.followUpNote}
              allProducts={products}
              onUpdateNotes={handleUpdateNotes}
              onUpdateVoiceNote={handleUpdateVoiceNote}
              onUpdateProductsDiscussed={handleUpdateProductsDiscussed}
              onUpdateFollowUp={handleUpdateFollowUp}
              onNext={() => goForward()}
            />
          )}
          {step === 5 && (
            <StepReview
              formData={formData}
              submitting={submitting}
              submitted={submitted}
              onEdit={goToStep}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
