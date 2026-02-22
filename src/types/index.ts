export type AccountStatus =
  | "prospect"
  | "sample_sent"
  | "active"
  | "at_risk"
  | "dormant"
  | "churned";

export interface AccountDetail {
  id: string;
  orgId: string;
  name: string;
  dbaName: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  licenseNumber: string | null;
  licenseType: string | null;
  licenseExpiration: string | null;
  status: AccountStatus;
  revenueTier: RevenueTier;
  chainId: string | null;
  chainName: string | null;
  chainStoreCount: number | null;
  assignedRepId: string | null;
  repFirstName: string | null;
  repLastName: string | null;
  repAvatarUrl: string | null;
  paymentTerms: string | null;
  notes: string | null;
  tags: string[] | null;
  googlePlaceId: string | null;
  createdAt: string;
  updatedAt: string;
  totalRevenue: string;
  ordersThisMonth: number;
  totalVisits: number;
  totalOrders: number;
  lastVisitDate: string | null;
  lastOrderDate: string | null;
  avgOrderValue: string;
}

export interface ContactRow {
  id: string;
  accountId: string;
  orgId: string;
  firstName: string;
  lastName: string;
  role: string | null;
  roleLabel: string | null;
  isPrimaryDecisionMaker: boolean | null;
  phone: string | null;
  email: string | null;
  preferredContactMethod: string | null;
  bestVisitDays: string[] | null;
  bestVisitTimes: string | null;
  notes: string | null;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRow {
  id: string;
  createdAt: string;
  stage: string;
  source: string | null;
  total: string;
  subtotal: string | null;
  discountAmount: string | null;
  paymentStatus: string;
  paymentTerms: string | null;
  deliveryDate: string | null;
  expectedCloseDate: string | null;
  notes: string | null;
  repFirstName: string | null;
  repLastName: string | null;
  lineItemsSummary: Array<{
    productName: string;
    quantity: number;
    lineTotal: string;
  }> | null;
  lineItemCount: number;
}

export interface VisitRow {
  id: string;
  checkInTime: string;
  checkOutTime: string | null;
  visitType: string | null;
  outcome: string | null;
  notes: string | null;
  aiRawTranscript: string | null;
  photos: string[] | null;
  buyerFeedbackLook: string | null;
  buyerFeedbackSmell: string | null;
  buyerFeedbackPackaging: string | null;
  buyerFeedbackPricing: string | null;
  shelfAvailability: string | null;
  competitorBrandsNoted: string[] | null;
  nextFollowUpDate: string | null;
  nextFollowUpNotes: string | null;
  repFirstName: string | null;
  repLastName: string | null;
  repAvatarUrl: string | null;
  contactsMetNames: Array<{ firstName: string; lastName: string }> | null;
}

export interface SampleRow {
  id: string;
  droppedOffDate: string;
  productsSampled: Array<{
    productName: string;
    quantity: number;
    unitSize?: string;
  }>;
  status: string;
  feedbackDueDate: string | null;
  feedbackNotes: string | null;
  followUpCount: number | null;
  lastFollowUpDate: string | null;
  convertedOrderId: string | null;
  notes: string | null;
  createdAt: string;
  repFirstName: string | null;
  repLastName: string | null;
  recipientFirstName: string | null;
  recipientLastName: string | null;
}

export interface CompetitiveBrandRow {
  brand_name: string;
  times_noted: number;
  last_seen: string | null;
}

export type ActivityItem =
  | ({
      type: "visit";
      id: string;
      timestamp: string;
      repFirstName: string | null;
      repLastName: string | null;
      visitType: string | null;
      outcome: string | null;
      notes: string | null;
      buyerFeedbackLook: string | null;
      buyerFeedbackSmell: string | null;
      buyerFeedbackPackaging: string | null;
      buyerFeedbackPricing: string | null;
      shelfAvailability: string | null;
      competitorBrandsNoted: string[] | null;
      aiRawTranscript: string | null;
      photos: string[] | null;
      checkOutTime: string | null;
    })
  | ({
      type: "order";
      id: string;
      timestamp: string;
      repFirstName: string | null;
      repLastName: string | null;
      stage: string;
      total: string;
      paymentStatus: string;
      source: string | null;
      notes: string | null;
      lineItemsSummary: Array<{
        productName: string;
        quantity: number;
      }> | null;
    })
  | ({
      type: "sample";
      id: string;
      timestamp: string;
      repFirstName: string | null;
      repLastName: string | null;
      productsSampled: unknown;
      status: string;
      feedbackNotes: string | null;
      droppedOffDate: string;
    })
  | ({
      type: "task";
      id: string;
      timestamp: string;
      repFirstName: string | null;
      repLastName: string | null;
      title: string;
      status: string;
      priority: string | null;
      dueDate: string;
      description: string | null;
      taskType: string | null;
    });

export type RevenueTier = "A" | "B" | "C" | "D" | "unranked";

export interface AccountListItem {
  id: string;
  name: string;
  dbaName: string | null;
  city: string;
  state: string;
  status: AccountStatus;
  revenueTier: RevenueTier;
  chainId: string | null;
  chainName: string | null;
  assignedRepId: string | null;
  repFirstName: string | null;
  repLastName: string | null;
  tags: string[] | null;
  lastVisitDate: string | null;
  lastOrderDate: string | null;
}

export interface AccountsApiResponse {
  accounts: AccountListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface RepOption {
  id: string;
  firstName: string;
  lastName: string;
}

export const STATUS_OPTIONS: { value: AccountStatus; label: string }[] = [
  { value: "prospect", label: "Prospect" },
  { value: "sample_sent", label: "Sample Sent" },
  { value: "active", label: "Active" },
  { value: "at_risk", label: "At Risk" },
  { value: "dormant", label: "Dormant" },
  { value: "churned", label: "Churned" },
];

export const TIER_OPTIONS: { value: RevenueTier; label: string }[] = [
  { value: "A", label: "Tier A" },
  { value: "B", label: "Tier B" },
  { value: "C", label: "Tier C" },
  { value: "D", label: "Tier D" },
  { value: "unranked", label: "Unranked" },
];

export const STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; className: string }
> = {
  prospect: {
    label: "Prospect",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  sample_sent: {
    label: "Sample Sent",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  at_risk: {
    label: "At Risk",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  dormant: {
    label: "Dormant",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  churned: {
    label: "Churned",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

export const TIER_CONFIG: Record<
  RevenueTier,
  { className: string; variant?: "outline" }
> = {
  A: { className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  B: { className: "bg-blue-100 text-blue-800 border-blue-200" },
  C: { className: "bg-amber-100 text-amber-800 border-amber-200" },
  D: { className: "bg-gray-100 text-gray-800 border-gray-200" },
  unranked: { className: "", variant: "outline" },
};
