"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock } from "lucide-react";
import type { AccountOption } from "./visit-log-types";
import { STATUS_CONFIG } from "@/types";
import type { AccountStatus } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface StepSelectAccountProps {
  recentAccounts: AccountOption[];
  allAccounts: AccountOption[];
  onSelect: (account: AccountOption) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export function StepSelectAccount({
  recentAccounts,
  allAccounts,
  onSelect,
  onSearch,
  searchQuery,
}: StepSelectAccountProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setLocalQuery(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(value), 200);
    },
    [onSearch]
  );

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const filteredRecent = localQuery
    ? recentAccounts.filter(
        (a) =>
          a.name.toLowerCase().includes(localQuery.toLowerCase()) ||
          a.city.toLowerCase().includes(localQuery.toLowerCase())
      )
    : recentAccounts;

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white z-10 pb-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            value={localQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search accounts..."
            className="pl-10 h-11 text-base"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {filteredRecent.length > 0 && !localQuery && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recent
              </span>
            </div>
            <div className="space-y-1">
              {filteredRecent.map((account) => (
                <AccountItem
                  key={account.id}
                  account={account}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          {(localQuery || filteredRecent.length === 0) && (
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {localQuery ? "Search Results" : "All Accounts"}
              </span>
            </div>
          )}
          {!localQuery && filteredRecent.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                All Accounts
              </span>
            </div>
          )}
          <div className="space-y-1">
            {allAccounts.length === 0 && localQuery && (
              <p className="text-sm text-gray-500 py-8 text-center">
                No accounts found for &ldquo;{localQuery}&rdquo;
              </p>
            )}
            {allAccounts.map((account) => (
              <AccountItem
                key={account.id}
                account={account}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountItem({
  account,
  onSelect,
}: {
  account: AccountOption;
  onSelect: (a: AccountOption) => void;
}) {
  const statusKey = account.status as AccountStatus;
  const config = STATUS_CONFIG[statusKey];

  return (
    <button
      type="button"
      onClick={() => onSelect(account)}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 truncate">
            {account.name}
          </span>
          {config && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${config.className}`}
            >
              {config.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">{account.city}</span>
          {account.lastVisitDate && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(account.lastVisitDate), {
                  addSuffix: true,
                })}
              </span>
            </>
          )}
        </div>
      </div>
      <svg
        className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
