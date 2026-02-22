export type AccountStatus =
  | "prospect"
  | "sample_sent"
  | "active"
  | "at_risk"
  | "dormant"
  | "churned";

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
