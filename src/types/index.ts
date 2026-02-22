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

// ─── Products ────────────────────────────────────────────────────────────────

export type ProductCategory =
  | "flower"
  | "pre_roll"
  | "edible"
  | "vape"
  | "concentrate"
  | "topical"
  | "tincture"
  | "accessory"
  | "other";

export type StrainType = "indica" | "sativa" | "hybrid" | "cbd" | "blend";

export type ProductStatus =
  | "active"
  | "limited"
  | "out_of_stock"
  | "discontinued";

export interface ProductListItem {
  id: string;
  orgId: string;
  name: string;
  sku: string;
  category: ProductCategory | null;
  subcategory: string | null;
  strainName: string | null;
  strainType: StrainType | null;
  thcPercentMin: string | null;
  thcPercentMax: string | null;
  cbdPercentMin: string | null;
  cbdPercentMax: string | null;
  unitSize: string;
  wholesalePrice: string;
  msrp: string | null;
  availableInventory: number | null;
  status: ProductStatus | null;
  growType: string | null;
  turnaroundTime: string | null;
  minimumOrder: string | null;
  coaUrl: string | null;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsApiResponse {
  products: ProductListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export const PRODUCT_STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; className: string; dotClass: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  limited: {
    label: "Limited",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "bg-red-100 text-red-800 border-red-200",
    dotClass: "bg-red-500",
  },
  discontinued: {
    label: "Discontinued",
    className: "bg-gray-100 text-gray-700 border-gray-200",
    dotClass: "bg-gray-400",
  },
};

export const PRODUCT_CATEGORY_CONFIG: Record<
  ProductCategory,
  { label: string; bg: string; textColor: string; emoji: string; badgeClass: string }
> = {
  flower: {
    label: "Flower",
    bg: "bg-emerald-50",
    textColor: "text-emerald-600",
    emoji: "🌿",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pre_roll: {
    label: "Pre-Roll",
    bg: "bg-lime-50",
    textColor: "text-lime-600",
    emoji: "🌱",
    badgeClass: "bg-lime-50 text-lime-700 border-lime-200",
  },
  edible: {
    label: "Edible",
    bg: "bg-orange-50",
    textColor: "text-orange-600",
    emoji: "🍬",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
  },
  vape: {
    label: "Vape",
    bg: "bg-sky-50",
    textColor: "text-sky-600",
    emoji: "💨",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  concentrate: {
    label: "Concentrate",
    bg: "bg-purple-50",
    textColor: "text-purple-600",
    emoji: "💎",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  topical: {
    label: "Topical",
    bg: "bg-teal-50",
    textColor: "text-teal-600",
    emoji: "🧴",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
  },
  tincture: {
    label: "Tincture",
    bg: "bg-pink-50",
    textColor: "text-pink-600",
    emoji: "💧",
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
  },
  accessory: {
    label: "Accessory",
    bg: "bg-gray-50",
    textColor: "text-gray-600",
    emoji: "🔧",
    badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
  },
  other: {
    label: "Other",
    bg: "bg-slate-50",
    textColor: "text-slate-600",
    emoji: "📦",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

// ─── Orders / Pipeline ───────────────────────────────────────────────────────

export type OrderStage =
  | "lead"
  | "quote_sent"
  | "confirmed"
  | "processing"
  | "ready_for_delivery"
  | "delivered"
  | "paid"
  | "lost"
  | "cancelled";

export type OrderSource =
  | "in_person"
  | "phone"
  | "text"
  | "email"
  | "leaflink"
  | "growflow"
  | "nabis"
  | "distru"
  | "other";

export type PaymentStatus = "unpaid" | "partial" | "paid" | "overdue";

export type LossReason =
  | "price"
  | "competitor"
  | "out_of_stock"
  | "no_response"
  | "quality"
  | "shelf_full"
  | "other";

export interface PipelineLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  discountPercent: string;
  lineTotal: string;
}

export interface PipelineOrder {
  id: string;
  accountId: string;
  accountName: string | null;
  repId: string | null;
  repFirstName: string | null;
  repLastName: string | null;
  repAvatarUrl: string | null;
  stage: OrderStage;
  source: OrderSource | null;
  expectedCloseDate: string | null;
  total: string | null;
  subtotal: string | null;
  discountAmount: string | null;
  taxAmount: string | null;
  paymentTerms: string | null;
  paymentStatus: string;
  linkedVisitId: string | null;
  linkedSampleId: string | null;
  lossReason: LossReason | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  stageEnteredAt: string | null;
  lineItems: PipelineLineItem[] | null;
  lineItemCount: number;
}

export interface OrderDetailLineItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string | null;
  productSku: string | null;
  productCategory: string | null;
  quantity: number;
  unitPrice: string;
  discountPercent: string | null;
  lineTotal: string;
  notes: string | null;
}

export interface OrderStageHistoryEntry {
  id: string;
  fromStage: string | null;
  toStage: string;
  changedBy: string;
  changedByFirstName: string | null;
  changedByLastName: string | null;
  changedByAvatarUrl: string | null;
  changedAt: string;
  notes: string | null;
}

export interface OrderDetail extends Omit<PipelineOrder, "lineItems"> {
  actualCloseDate: string | null;
  deliveryDate: string | null;
  lineItems: OrderDetailLineItem[];
  stageHistory: OrderStageHistoryEntry[];
}

export const STAGE_CONFIG: Record<
  OrderStage,
  {
    label: string;
    bgClass: string;
    headerClass: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  lead: {
    label: "Lead",
    bgClass: "bg-blue-50",
    headerClass: "bg-blue-100 border-blue-200",
    badgeClass: "bg-blue-100 text-blue-800",
    dotClass: "bg-blue-400",
  },
  quote_sent: {
    label: "Quote Sent",
    bgClass: "bg-purple-50",
    headerClass: "bg-purple-100 border-purple-200",
    badgeClass: "bg-purple-100 text-purple-800",
    dotClass: "bg-purple-400",
  },
  confirmed: {
    label: "Confirmed",
    bgClass: "bg-amber-50",
    headerClass: "bg-amber-100 border-amber-200",
    badgeClass: "bg-amber-100 text-amber-800",
    dotClass: "bg-amber-400",
  },
  processing: {
    label: "Processing",
    bgClass: "bg-orange-50",
    headerClass: "bg-orange-100 border-orange-200",
    badgeClass: "bg-orange-100 text-orange-800",
    dotClass: "bg-orange-400",
  },
  ready_for_delivery: {
    label: "Ready for Delivery",
    bgClass: "bg-teal-50",
    headerClass: "bg-teal-100 border-teal-200",
    badgeClass: "bg-teal-100 text-teal-800",
    dotClass: "bg-teal-400",
  },
  delivered: {
    label: "Delivered",
    bgClass: "bg-green-50",
    headerClass: "bg-green-100 border-green-200",
    badgeClass: "bg-green-100 text-green-800",
    dotClass: "bg-green-400",
  },
  paid: {
    label: "Paid",
    bgClass: "bg-emerald-50",
    headerClass: "bg-emerald-100 border-emerald-200",
    badgeClass: "bg-emerald-100 text-emerald-800",
    dotClass: "bg-emerald-500",
  },
  lost: {
    label: "Lost",
    bgClass: "bg-red-50",
    headerClass: "bg-red-100 border-red-200",
    badgeClass: "bg-red-100 text-red-800",
    dotClass: "bg-red-400",
  },
  cancelled: {
    label: "Cancelled",
    bgClass: "bg-gray-50",
    headerClass: "bg-gray-100 border-gray-200",
    badgeClass: "bg-gray-100 text-gray-600",
    dotClass: "bg-gray-400",
  },
};

export const SOURCE_CONFIG: Record<
  OrderSource,
  { label: string; icon: string }
> = {
  in_person: { label: "In Person", icon: "🤝" },
  phone: { label: "Phone", icon: "📞" },
  text: { label: "Text", icon: "💬" },
  email: { label: "Email", icon: "📧" },
  leaflink: { label: "LeafLink", icon: "🍃" },
  growflow: { label: "GrowFlow", icon: "📊" },
  nabis: { label: "Nabis", icon: "🌿" },
  distru: { label: "Distru", icon: "📦" },
  other: { label: "Other", icon: "❓" },
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  unpaid: {
    label: "Unpaid",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  partial: {
    label: "Partial",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-200 text-red-900 border-red-300",
  },
};

export const LOSS_REASON_OPTIONS = [
  { value: "price", label: "Price Too High" },
  { value: "competitor", label: "Went with Competitor" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "no_response", label: "No Response" },
  { value: "quality", label: "Quality Concerns" },
  { value: "shelf_full", label: "Shelf Full" },
  { value: "other", label: "Other" },
] as const;

export const ACTIVE_STAGES: OrderStage[] = [
  "lead",
  "quote_sent",
  "confirmed",
  "processing",
  "ready_for_delivery",
  "delivered",
  "paid",
];

export const CLOSED_STAGES: OrderStage[] = ["lost", "cancelled"];

export const STAGE_ORDER: OrderStage[] = [
  "lead",
  "quote_sent",
  "confirmed",
  "processing",
  "ready_for_delivery",
  "delivered",
  "paid",
  "lost",
  "cancelled",
];

export const STRAIN_TYPE_CONFIG: Record<
  StrainType,
  { label: string; className: string }
> = {
  indica: {
    label: "Indica",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  sativa: {
    label: "Sativa",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  hybrid: {
    label: "Hybrid",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  cbd: {
    label: "CBD",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  blend: {
    label: "Blend",
    className: "bg-pink-100 text-pink-800 border-pink-200",
  },
};
