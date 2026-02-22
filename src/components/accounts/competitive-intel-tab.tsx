"use client";

import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CompetitiveBrandRow } from "@/types";

interface CompetitiveIntelTabProps {
  accountId: string;
}

export function CompetitiveIntelTab({ accountId }: CompetitiveIntelTabProps) {
  const [brands, setBrands] = useState<CompetitiveBrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/competitive-intel`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBrands(data.brands);
    } catch {
      setError("Failed to load competitive data.");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  if (brands.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">No competitive data yet.</p>
        <p className="text-xs mt-1">
          Add competitor brands when logging visits to populate this tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Auto-populated from competitor brands noted during visit logs.
      </p>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left font-medium text-gray-500 pb-2 pr-4">Brand Name</th>
              <th className="text-right font-medium text-gray-500 pb-2 pr-4">Times Noted</th>
              <th className="text-left font-medium text-gray-500 pb-2">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium text-gray-900">
                  {brand.brand_name}
                </td>
                <td className="py-3 pr-4 text-right">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                    {brand.times_noted}
                  </span>
                </td>
                <td className="py-3 text-gray-600">
                  {brand.last_seen
                    ? new Date(brand.last_seen).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {brands.map((brand, i) => (
          <div
            key={i}
            className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3"
          >
            <div>
              <p className="font-medium text-gray-900 text-sm">{brand.brand_name}</p>
              {brand.last_seen && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Last:{" "}
                  {new Date(brand.last_seen).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 text-sm font-bold">
              {brand.times_noted}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
