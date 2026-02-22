"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountsFilterBar } from "./accounts-filter-bar";
import { AccountsTable } from "./accounts-table";
import { AccountsCardList } from "./accounts-card-list";
import { AccountsEmptyState } from "./accounts-empty-state";
import { AccountsSkeleton } from "./accounts-skeleton";
import type { AccountListItem, AccountsApiResponse, RepOption } from "@/types";

interface AccountsPageContentProps {
  reps: RepOption[];
}

export function AccountsPageContent({ reps }: AccountsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const tier = searchParams.get("tier") || "";
  const repId = searchParams.get("rep_id") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const sortBy = searchParams.get("sortBy") || "name";
  const sortOrder = searchParams.get("sortOrder") || "asc";

  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);
  const isFirstDebounce = useRef(true);

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.replace(`/dashboard/accounts?${params.toString()}`);
    },
    [router],
  );

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (isFirstDebounce.current) {
      isFirstDebounce.current = false;
      return;
    }
    const timer = setTimeout(() => {
      updateParams({ search: searchInput, page: "" });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (tier) params.set("tier", tier);
        if (repId) params.set("rep_id", repId);
        params.set("page", String(page));
        params.set("limit", "25");
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);

        const res = await fetch(`/api/accounts?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch accounts");
        const data: AccountsApiResponse = await res.json();

        if (!cancelled) {
          setAccounts(data.accounts);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error("Error fetching accounts:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAccounts();
    return () => {
      cancelled = true;
    };
  }, [search, status, tier, repId, page, sortBy, sortOrder]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      updateParams({ sortOrder: sortOrder === "asc" ? "desc" : "asc" });
    } else {
      updateParams({ sortBy: column, sortOrder: "asc" });
    }
  };

  const handleClearFilters = () => {
    setSearchInput("");
    router.replace("/dashboard/accounts");
  };

  const statuses = status ? status.split(",") : [];
  const tiers = tier ? tier.split(",") : [];
  const hasActiveFilters =
    !!search || statuses.length > 0 || tiers.length > 0 || !!repId;

  const showingFrom = total > 0 ? (page - 1) * 25 + 1 : 0;
  const showingTo = Math.min(page * 25, total);

  if (loading && accounts.length === 0) {
    return <AccountsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B4332]">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            {total} dispensar{total === 1 ? "y" : "ies"} in your pipeline
          </p>
        </div>
        <Button
          asChild
          className="gap-2 bg-[#D4A843] text-white hover:bg-[#C49933]"
        >
          <Link href="/dashboard/accounts/new">
            <Plus className="size-4" />
            Add Account
          </Link>
        </Button>
      </div>

      <AccountsFilterBar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        statuses={statuses}
        onStatusChange={(s) =>
          updateParams({ status: s.join(","), page: "" })
        }
        tiers={tiers}
        onTierChange={(t) =>
          updateParams({ tier: t.join(","), page: "" })
        }
        repId={repId}
        onRepChange={(r) => updateParams({ rep_id: r, page: "" })}
        reps={reps}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {!loading && accounts.length === 0 && !hasActiveFilters ? (
        <AccountsEmptyState />
      ) : !loading && accounts.length === 0 && hasActiveFilters ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white py-16">
          <p className="mb-1 text-base font-medium text-foreground">
            No accounts match your filters
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden rounded-lg border bg-white md:block">
            <AccountsTable
              accounts={accounts}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          </div>

          <div className="md:hidden">
            <AccountsCardList accounts={accounts} />
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Showing {showingFrom}–{showingTo} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() =>
                    updateParams({ page: String(page - 1) })
                  }
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() =>
                    updateParams({ page: String(page + 1) })
                  }
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
