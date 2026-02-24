"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderRow } from "@/types";

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  quote_sent: "Quote Sent",
  confirmed: "Confirmed",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  delivered: "Delivered",
  paid: "Paid",
  lost: "Lost",
  cancelled: "Cancelled",
};

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-gray-100 text-gray-700",
  quote_sent: "bg-blue-100 text-blue-700",
  confirmed: "bg-amber-100 text-amber-700",
  processing: "bg-purple-100 text-purple-700",
  ready_for_delivery: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-red-50 text-red-700",
  partial: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-100 text-red-800",
};

const SOURCE_LABELS: Record<string, string> = {
  in_person: "In Person",
  phone: "Phone",
  text: "Text",
  email: "Email",
  leaflink: "LeafLink",
  growflow: "GrowFlow",
  nabis: "Nabis",
  distru: "Distru",
  other: "Other",
};

type SortField = "createdAt" | "total";
type SortDir = "asc" | "desc";

function formatCurrency(v: string | null) {
  if (!v) return "$0";
  const n = parseFloat(v);
  if (isNaN(n)) return "$0";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface OrdersTabProps {
  accountId: string;
}

export function OrdersTab({ accountId }: OrdersTabProps) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/orders`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOrders(data.orders);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sorted = [...orders].sort((a, b) => {
    let cmp = 0;
    if (sortField === "createdAt") {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      cmp = parseFloat(a.total) - parseFloat(b.total);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 ml-1 inline" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 ml-1 inline" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href={`/dashboard/pipeline/new?account=${accountId}`}>
          <Button size="sm" className="bg-[#1B4332] hover:bg-[#163728] text-white">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Order
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No orders yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th
                    className="text-left font-medium text-gray-500 pb-2 pr-4 cursor-pointer hover:text-gray-700"
                    onClick={() => toggleSort("createdAt")}
                  >
                    Date <SortIcon field="createdAt" />
                  </th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Stage</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Products</th>
                  <th
                    className="text-right font-medium text-gray-500 pb-2 pr-4 cursor-pointer hover:text-gray-700"
                    onClick={() => toggleSort("total")}
                  >
                    Total <SortIcon field="total" />
                  </th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Source</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Rep</th>
                  <th className="text-left font-medium text-gray-500 pb-2">Payment</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((order) => (
                  <Fragment key={order.id}>
                    <tr
                      className="border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        setExpandedId(expandedId === order.id ? null : order.id)
                      }
                    >
                      <td className="py-3 pr-4 text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={`text-xs ${STAGE_COLORS[order.stage] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {STAGE_LABELS[order.stage] ?? order.stage}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 max-w-[200px]">
                        {order.lineItemsSummary && order.lineItemsSummary.length > 0 ? (
                          <span className="truncate block">
                            {order.lineItemsSummary
                              .slice(0, 2)
                              .map((li) => li.productName)
                              .join(", ")}
                            {order.lineItemCount > 2 &&
                              ` +${order.lineItemCount - 2} more`}
                          </span>
                        ) : (
                          <span className="text-gray-300">No products</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-3 pr-4">
                        {order.source ? (
                          <Badge variant="outline" className="text-xs">
                            {SOURCE_LABELS[order.source] ?? order.source}
                          </Badge>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {order.repFirstName && order.repLastName
                          ? `${order.repFirstName} ${order.repLastName}`
                          : "—"}
                      </td>
                      <td className="py-3">
                        <Badge
                          className={`text-xs ${PAYMENT_STATUS_COLORS[order.paymentStatus] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {order.paymentStatus.charAt(0).toUpperCase() +
                            order.paymentStatus.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr key={`${order.id}-expand`} className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="space-y-2">
                            {order.lineItemsSummary &&
                              order.lineItemsSummary.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Line Items
                                  </p>
                                  <div className="space-y-1">
                                    {order.lineItemsSummary.map((li, i) => (
                                      <div
                                        key={i}
                                        className="flex justify-between text-xs text-gray-700"
                                      >
                                        <span>
                                          {li.productName} ×{li.quantity}
                                        </span>
                                        <span>{formatCurrency(li.lineTotal)}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between text-xs font-medium text-gray-900 pt-1 border-t border-gray-200">
                                      <span>Total</span>
                                      <span>{formatCurrency(order.total)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            {order.deliveryDate && (
                              <p className="text-xs text-gray-500">
                                Delivery:{" "}
                                {new Date(
                                  order.deliveryDate + "T00:00:00",
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            )}
                            {order.notes && (
                              <p className="text-xs text-gray-500">{order.notes}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sorted.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg p-3 space-y-2 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === order.id ? null : order.id)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs ${STAGE_COLORS[order.stage] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {STAGE_LABELS[order.stage] ?? order.stage}
                      </Badge>
                      <Badge
                        className={`text-xs ${PAYMENT_STATUS_COLORS[order.paymentStatus] ?? ""}`}
                      >
                        {order.paymentStatus.charAt(0).toUpperCase() +
                          order.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {order.repFirstName
                        ? ` · ${order.repFirstName} ${order.repLastName}`
                        : ""}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.total)}
                  </p>
                </div>

                {order.lineItemsSummary && order.lineItemsSummary.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {order.lineItemsSummary
                      .slice(0, 2)
                      .map((li) => li.productName)
                      .join(", ")}
                    {order.lineItemCount > 2 && ` +${order.lineItemCount - 2} more`}
                  </p>
                )}

                {expandedId === order.id &&
                  order.lineItemsSummary &&
                  order.lineItemsSummary.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      {order.lineItemsSummary.map((li, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-xs text-gray-700"
                        >
                          <span>
                            {li.productName} ×{li.quantity}
                          </span>
                          <span>{formatCurrency(li.lineTotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
