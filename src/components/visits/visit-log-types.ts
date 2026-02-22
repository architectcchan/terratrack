export interface VisitFormData {
  accountId: string;
  accountName: string;
  visitType: VisitType | null;
  contactsMet: string[];
  contactsMetNames: Record<string, string>;
  noOneAvailable: boolean;
  outcome: VisitOutcome | null;
  sampleData: SampleFormData | null;
  feedbackLook: FeedbackValue | null;
  feedbackSmell: FeedbackValue | null;
  feedbackPackaging: FeedbackValue | null;
  feedbackPricing: PricingValue | null;
  shelfAvailability: ShelfValue | null;
  competitorBrands: string[];
  notes: string;
  voiceNoteDuration: number | null;
  voiceNoteBlob: Blob | null;
  productsDiscussed: ProductOption[];
  followUpDate: string | null;
  followUpNote: string;
  checkInLat: string | null;
  checkInLng: string | null;
}

export interface SampleFormData {
  products: SampleProduct[];
  recipientContactId: string | null;
  recipientName: string;
}

export interface SampleProduct {
  productId?: string;
  productName: string;
  quantity: number;
  unitSize?: string;
}

export interface AccountOption {
  id: string;
  name: string;
  city: string;
  status: string;
  lastVisitDate: string | null;
}

export interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
  role: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  strainName: string | null;
  unitSize: string;
}

export type VisitType =
  | "scheduled_meeting"
  | "drop_in"
  | "delivery"
  | "budtender_training"
  | "sample_drop"
  | "vendor_day";

export type VisitOutcome =
  | "order_placed"
  | "reorder_confirmed"
  | "sample_left"
  | "follow_up_needed"
  | "no_decision"
  | "buyer_unavailable"
  | "declined";

export type FeedbackValue = "positive" | "neutral" | "negative";
export type PricingValue = "fits" | "too_high" | "too_low";
export type ShelfValue = "has_opening" | "full" | "unknown";

export const VISIT_TYPES: { value: VisitType; label: string; emoji: string }[] =
  [
    { value: "scheduled_meeting", label: "Scheduled Meeting", emoji: "📅" },
    { value: "drop_in", label: "Drop-in", emoji: "🚶" },
    { value: "delivery", label: "Delivery", emoji: "🚚" },
    { value: "sample_drop", label: "Sample Drop", emoji: "🧪" },
    { value: "budtender_training", label: "Budtender Training", emoji: "🎓" },
    { value: "vendor_day", label: "Vendor Day", emoji: "🎪" },
  ];

export const VISIT_OUTCOMES: {
  value: VisitOutcome;
  label: string;
  emoji: string;
}[] = [
  { value: "order_placed", label: "Order Placed", emoji: "✅" },
  { value: "reorder_confirmed", label: "Reorder Confirmed", emoji: "🔄" },
  { value: "sample_left", label: "Sample Left", emoji: "🧪" },
  { value: "follow_up_needed", label: "Follow-up Needed", emoji: "📞" },
  { value: "no_decision", label: "No Decision", emoji: "🤷" },
  { value: "buyer_unavailable", label: "Buyer Unavailable", emoji: "🚫" },
  { value: "declined", label: "Declined", emoji: "❌" },
];

export const CONTACT_ROLES: Record<string, string> = {
  buyer: "Buyer",
  store_manager: "Store Manager",
  assistant_manager: "Asst. Manager",
  budtender: "Budtender",
  owner: "Owner",
  other: "Other",
};

export function getInitialFormData(): VisitFormData {
  return {
    accountId: "",
    accountName: "",
    visitType: null,
    contactsMet: [],
    contactsMetNames: {},
    noOneAvailable: false,
    outcome: null,
    sampleData: null,
    feedbackLook: null,
    feedbackSmell: null,
    feedbackPackaging: null,
    feedbackPricing: null,
    shelfAvailability: null,
    competitorBrands: [],
    notes: "",
    voiceNoteDuration: null,
    voiceNoteBlob: null,
    productsDiscussed: [],
    followUpDate: null,
    followUpNote: "",
    checkInLat: null,
    checkInLng: null,
  };
}
