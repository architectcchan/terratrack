"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  ChevronDown,
  User,
  FileText,
  ClipboardList,
  Package,
  Calendar,
  ShoppingCart,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  STATUS_CONFIG,
  STATUS_OPTIONS,
  TIER_CONFIG,
  TIER_OPTIONS,
} from "@/types";
import type { AccountDetail, AccountStatus, RepOption, RevenueTier } from "@/types";

interface AccountHeaderProps {
  account: AccountDetail;
  reps: RepOption[];
  onAccountUpdate: (patch: Partial<AccountDetail>) => void;
  onDropSample: () => void;
  onAddTask: () => void;
}

export function AccountHeader({
  account,
  reps,
  onAccountUpdate,
  onDropSample,
  onAddTask,
}: AccountHeaderProps) {
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [tierUpdating, setTierUpdating] = useState(false);
  const [repUpdating, setRepUpdating] = useState(false);
  const [repPopoverOpen, setRepPopoverOpen] = useState(false);

  const patch = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      onAccountUpdate(json.account);
    }
  };

  const handleStatusChange = async (status: AccountStatus) => {
    if (statusUpdating) return;
    setStatusUpdating(true);
    await patch({ status });
    setStatusUpdating(false);
  };

  const handleTierChange = async (revenueTier: RevenueTier) => {
    if (tierUpdating) return;
    setTierUpdating(true);
    await patch({ revenueTier });
    setTierUpdating(false);
  };

  const handleRepChange = async (repId: string | null) => {
    if (repUpdating) return;
    setRepUpdating(true);
    setRepPopoverOpen(false);
    await patch({ assignedRepId: repId });
    setRepUpdating(false);
  };

  const statusCfg = STATUS_CONFIG[account.status];
  const tierCfg = TIER_CONFIG[account.revenueTier];

  const mapsAddress = encodeURIComponent(
    `${account.addressLine1}, ${account.city}, ${account.state} ${account.zip}`,
  );

  const repInitials =
    account.repFirstName && account.repLastName
      ? `${account.repFirstName[0]}${account.repLastName[0]}`
      : "?";

  const formatPaymentTerms = (t: string | null) => {
    if (!t) return null;
    const map: Record<string, string> = {
      cod: "COD",
      net_15: "Net 15",
      net_30: "Net 30",
      net_45: "Net 45",
      custom: "Custom",
    };
    return map[t] ?? t;
  };

  const formatLicenseType = (t: string | null) => {
    if (!t) return null;
    return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 space-y-4">
      {/* Name row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {account.name}
          </h1>
          {account.dbaName && (
            <p className="text-sm text-gray-500 mt-0.5">DBA: {account.dbaName}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Chain badge */}
          {account.chainId && account.chainName && (
            <Badge
              variant="outline"
              className="cursor-pointer border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <Link2 className="w-3 h-3 mr-1" />
              {account.chainName}
              {account.chainStoreCount
                ? ` (${account.chainStoreCount} stores)`
                : ""}
            </Badge>
          )}

          {/* Status badge */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                className={`cursor-pointer select-none ${statusCfg.className} border`}
              >
                {statusUpdating ? "..." : statusCfg.label}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onSelect={() => handleStatusChange(opt.value)}
                  className={
                    opt.value === account.status ? "font-medium" : ""
                  }
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tier badge */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                className={`cursor-pointer select-none ${
                  account.revenueTier === "unranked"
                    ? "border border-gray-300 text-gray-600"
                    : `${tierCfg.className} border`
                }`}
              >
                {tierUpdating
                  ? "..."
                  : account.revenueTier === "unranked"
                    ? "Unranked"
                    : `Tier ${account.revenueTier}`}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TIER_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onSelect={() => handleTierChange(opt.value)}
                  className={
                    opt.value === account.revenueTier ? "font-medium" : ""
                  }
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
        {/* Address */}
        <a
          href={`https://maps.google.com/?q=${mapsAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-[#1B4332] transition-colors"
        >
          <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
          <span>
            {account.addressLine1}
            {account.addressLine2 ? `, ${account.addressLine2}` : ""},{" "}
            {account.city}, {account.state} {account.zip}
          </span>
        </a>

        {/* Phone */}
        {account.phone && (
          <a
            href={`tel:${account.phone}`}
            className="flex items-center gap-1.5 hover:text-[#1B4332] transition-colors"
          >
            <Phone className="w-4 h-4 shrink-0 text-gray-400" />
            <span>{account.phone}</span>
          </a>
        )}

        {/* Email */}
        {account.email && (
          <a
            href={`mailto:${account.email}`}
            className="flex items-center gap-1.5 hover:text-[#1B4332] transition-colors"
          >
            <Mail className="w-4 h-4 shrink-0 text-gray-400" />
            <span>{account.email}</span>
          </a>
        )}

        {/* Website */}
        {account.website && (
          <a
            href={account.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#1B4332] transition-colors"
          >
            <Globe className="w-4 h-4 shrink-0 text-gray-400" />
            <span className="truncate max-w-[180px]">
              {account.website.replace(/^https?:\/\//, "")}
            </span>
          </a>
        )}
      </div>

      {/* License + payment + rep row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
        {/* License */}
        {account.licenseNumber && (
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-gray-400" />
            <span>
              {formatLicenseType(account.licenseType)} #{account.licenseNumber}
              {account.licenseExpiration && (
                <span className="text-gray-400 ml-1">
                  · Exp {new Date(account.licenseExpiration + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Payment terms */}
        {account.paymentTerms && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <span className="font-medium text-gray-700">
              {formatPaymentTerms(account.paymentTerms)}
            </span>
          </div>
        )}

        {/* Assigned rep */}
        <Popover open={repPopoverOpen} onOpenChange={setRepPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 hover:text-[#1B4332] transition-colors">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px] bg-[#1B4332] text-white">
                  {account.assignedRepId ? repInitials : <User className="w-3 h-3" />}
                </AvatarFallback>
              </Avatar>
              <span className={account.assignedRepId ? "" : "text-gray-400 italic"}>
                {account.repFirstName && account.repLastName
                  ? `${account.repFirstName} ${account.repLastName}`
                  : "Unassigned"}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1" align="start">
            <div className="space-y-0.5">
              <button
                onClick={() => handleRepChange(null)}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 text-gray-500 italic"
              >
                Unassigned
              </button>
              {reps.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => handleRepChange(rep.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                    rep.id === account.assignedRepId ? "font-medium bg-gray-50" : ""
                  }`}
                >
                  {rep.firstName} {rep.lastName}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
        <Link href={`/dashboard/visits/new?account=${account.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="border-[#D4A843] text-[#D4A843] hover:bg-amber-50 hover:text-[#c49b3b]"
          >
            <ClipboardList className="w-4 h-4 mr-1.5" />
            Log Visit
          </Button>
        </Link>
        <Link href={`/dashboard/pipeline/new?account=${account.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="border-[#D4A843] text-[#D4A843] hover:bg-amber-50 hover:text-[#c49b3b]"
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            Create Order
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="border-[#D4A843] text-[#D4A843] hover:bg-amber-50 hover:text-[#c49b3b]"
          onClick={onDropSample}
        >
          <Package className="w-4 h-4 mr-1.5" />
          Drop Sample
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-[#D4A843] text-[#D4A843] hover:bg-amber-50 hover:text-[#c49b3b]"
          onClick={onAddTask}
        >
          <ClipboardList className="w-4 h-4 mr-1.5" />
          Add Task
        </Button>
        <Link href={`/dashboard/events/new?account=${account.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="border-[#D4A843] text-[#D4A843] hover:bg-amber-50 hover:text-[#c49b3b]"
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Schedule Event
          </Button>
        </Link>
      </div>
    </div>
  );
}
