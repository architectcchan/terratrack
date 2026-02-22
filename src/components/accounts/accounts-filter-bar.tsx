"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/shared/multi-select";
import { STATUS_OPTIONS, TIER_OPTIONS } from "@/types";
import type { RepOption } from "@/types";

interface AccountsFilterBarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  statuses: string[];
  onStatusChange: (statuses: string[]) => void;
  tiers: string[];
  onTierChange: (tiers: string[]) => void;
  repId: string;
  onRepChange: (repId: string) => void;
  reps: RepOption[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function AccountsFilterBar({
  searchInput,
  onSearchChange,
  statuses,
  onStatusChange,
  tiers,
  onTierChange,
  repId,
  onRepChange,
  reps,
  hasActiveFilters,
  onClearFilters,
}: AccountsFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search accounts, cities, contacts..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 pl-9"
        />
      </div>

      <MultiSelect
        options={STATUS_OPTIONS}
        selected={statuses}
        onSelectionChange={onStatusChange}
        placeholder="Status"
        className="w-[130px]"
      />

      <MultiSelect
        options={TIER_OPTIONS}
        selected={tiers}
        onSelectionChange={onTierChange}
        placeholder="Tier"
        className="w-[120px]"
      />

      <Select value={repId || "all"} onValueChange={(v) => onRepChange(v === "all" ? "" : v)}>
        <SelectTrigger size="sm" className="h-9 w-[160px]">
          <SelectValue placeholder="Assigned Rep" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Reps</SelectItem>
          {reps.map((rep) => (
            <SelectItem key={rep.id} value={rep.id}>
              {rep.firstName} {rep.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 gap-1 text-muted-foreground"
        >
          <X className="size-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
