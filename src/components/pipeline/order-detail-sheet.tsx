"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Send,
  ArrowRight,
  Package,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import {
  type OrderDetail,
  STAGE_CONFIG,
  SOURCE_CONFIG,
  PAYMENT_STATUS_CONFIG,
  LOSS_REASON_OPTIONS,
  type PaymentStatus,
} from "@/types";
import { cn } from "@/lib/utils";

interface OrderDetailSheetProps {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function OrderDetailSheet({
  orderId,
  open,
  onClose,
  onUpdated,
}: OrderDetailSheetProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const [editingPaymentStatus, setEditingPaymentStatus] = useState<
    PaymentStatus | ""
  >("");
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchOrder = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error("Failed to load order");
      const data = await res.json();
      setOrder(data.order);
      setEditingPaymentStatus(data.order.paymentStatus as PaymentStatus);
    } catch {
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && orderId) {
      fetchOrder(orderId);
      setActiveTab("details");
      setNoteText("");
    }
  }, [open, orderId]);

  const handleAddNote = async () => {
    if (!noteText.trim() || !orderId) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const data = await res.json();
      setOrder((prev) => (prev ? { ...prev, notes: data.notes } : prev));
      setNoteText("");
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleSavePaymentStatus = async () => {
    if (!orderId || !editingPaymentStatus) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: editingPaymentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setOrder((prev) =>
        prev ? { ...prev, paymentStatus: editingPaymentStatus } : prev,
      );
      toast.success("Payment status updated");
      onUpdated();
    } catch {
      toast.error("Failed to update payment status");
    } finally {
      setSavingStatus(false);
    }
  };

  const stageCfg = order ? STAGE_CONFIG[order.stage] : null;
  const sourceCfg = order?.source ? SOURCE_CONFIG[order.source] : null;
  const paymentCfg = order?.paymentStatus
    ? PAYMENT_STATUS_CONFIG[order.paymentStatus as PaymentStatus]
    : null;

  const lossReasonLabel = order?.lossReason
    ? LOSS_REASON_OPTIONS.find((r) => r.value === order.lossReason)?.label
    : null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col p-0"
      >
        {loading || !order ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="px-6 pt-6 pb-3 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SheetTitle className="text-lg leading-tight">
                    <a
                      href={`/dashboard/accounts/${order.accountId}`}
                      className="hover:underline text-[#1B4332] inline-flex items-center gap-1"
                    >
                      {order.accountName ?? "Unknown Account"}
                      <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                    </a>
                  </SheetTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Order · created {formatDate(order.createdAt as string)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-2xl font-bold text-gray-900">
                    $
                    {parseFloat(order.total ?? "0").toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  {stageCfg && (
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        stageCfg.badgeClass,
                      )}
                    >
                      {stageCfg.label}
                    </span>
                  )}
                </div>
              </div>
            </SheetHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="mx-6 flex-shrink-0 grid w-auto grid-cols-3 h-9">
                <TabsTrigger value="details" className="text-xs">
                  Details
                </TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs">
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs">
                  Notes
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <div className="px-6 pb-8">
                  {/* ─── DETAILS TAB ─── */}
                  <TabsContent value="details" className="mt-4 space-y-5">
                    {/* Meta row */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Source</p>
                        <p className="font-medium">
                          {sourceCfg
                            ? `${sourceCfg.icon} ${sourceCfg.label}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Rep</p>
                        <p className="font-medium">
                          {[order.repFirstName, order.repLastName]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">
                          Expected Close
                        </p>
                        <p className="font-medium">
                          {formatDate(order.expectedCloseDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">
                          Payment Terms
                        </p>
                        <p className="font-medium">
                          {order.paymentTerms?.toUpperCase().replace("_", " ") ??
                            "—"}
                        </p>
                      </div>
                      {order.deliveryDate && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            Delivery Date
                          </p>
                          <p className="font-medium">
                            {formatDate(order.deliveryDate)}
                          </p>
                        </div>
                      )}
                      {order.actualCloseDate && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            Closed Date
                          </p>
                          <p className="font-medium">
                            {formatDate(order.actualCloseDate)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Loss reason */}
                    {lossReasonLabel && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                        <p className="text-xs text-red-500 mb-0.5 font-medium">
                          Loss Reason
                        </p>
                        <p className="text-red-800">{lossReasonLabel}</p>
                      </div>
                    )}

                    {/* Linked badges */}
                    {(order.linkedVisitId || order.linkedSampleId) && (
                      <div className="flex gap-2">
                        {order.linkedVisitId && (
                          <Badge
                            variant="outline"
                            className="gap-1 text-xs cursor-pointer"
                            onClick={() =>
                              (window.location.href = `/dashboard/visits`)
                            }
                          >
                            <ExternalLink className="h-3 w-3" /> Linked Visit
                          </Badge>
                        )}
                        {order.linkedSampleId && (
                          <Badge
                            variant="outline"
                            className="gap-1 text-xs"
                          >
                            <FlaskConical className="h-3 w-3" /> Linked Sample
                          </Badge>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Line items */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-gray-400" />
                        Line Items
                      </h3>
                      <div className="space-y-2">
                        {order.lineItems.map((li) => (
                          <div
                            key={li.id}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {li.productName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {li.productSku} · {li.quantity} ×{" "}
                                ${parseFloat(li.unitPrice).toFixed(2)}
                                {parseFloat(li.discountPercent ?? "0") > 0 &&
                                  ` (${li.discountPercent}% off)`}
                              </p>
                            </div>
                            <span className="text-sm font-semibold">
                              $
                              {parseFloat(li.lineTotal).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Order totals */}
                      <div className="bg-gray-50 rounded-lg p-3 mt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>
                            $
                            {parseFloat(
                              order.subtotal ?? "0",
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        {parseFloat(order.discountAmount ?? "0") > 0 && (
                          <div className="flex justify-between text-gray-500">
                            <span>Discount</span>
                            <span className="text-red-600">
                              -$
                              {parseFloat(
                                order.discountAmount ?? "0",
                              ).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-gray-900 border-t pt-1.5">
                          <span>Total</span>
                          <span>
                            $
                            {parseFloat(order.total ?? "0").toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Payment Status */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">
                          Payment Status
                        </Label>
                        {paymentCfg && (
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded border",
                              paymentCfg.className,
                            )}
                          >
                            {paymentCfg.label}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={editingPaymentStatus}
                          onValueChange={(v) =>
                            setEditingPaymentStatus(v as PaymentStatus)
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleSavePaymentStatus}
                          disabled={
                            savingStatus ||
                            editingPaymentStatus === order.paymentStatus
                          }
                          size="sm"
                          className="bg-[#1B4332] hover:bg-[#163829] text-white"
                        >
                          {savingStatus ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ─── TIMELINE TAB ─── */}
                  <TabsContent value="timeline" className="mt-4">
                    {order.stageHistory.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">
                        No stage history yet
                      </p>
                    ) : (
                      <ol className="relative border-l border-gray-200 ml-3">
                        {order.stageHistory.map((entry) => {
                          const fromCfg = entry.fromStage
                            ? STAGE_CONFIG[
                                entry.fromStage as keyof typeof STAGE_CONFIG
                              ]
                            : null;
                          const toCfg =
                            STAGE_CONFIG[
                              entry.toStage as keyof typeof STAGE_CONFIG
                            ];
                          const authorName = [
                            entry.changedByFirstName,
                            entry.changedByLastName,
                          ]
                            .filter(Boolean)
                            .join(" ");
                          const initials = [
                            entry.changedByFirstName,
                            entry.changedByLastName,
                          ]
                            .filter(Boolean)
                            .map((n) => n![0])
                            .join("");

                          return (
                            <li key={entry.id} className="mb-5 ml-5">
                              <span
                                className={cn(
                                  "absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white",
                                  toCfg?.dotClass ?? "bg-gray-300",
                                )}
                              />
                              <div className="flex items-center gap-2 mb-0.5">
                                {fromCfg ? (
                                  <div className="flex items-center gap-1 text-xs">
                                    <span
                                      className={cn(
                                        "px-1.5 py-0.5 rounded",
                                        fromCfg.badgeClass,
                                      )}
                                    >
                                      {fromCfg.label}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-gray-400" />
                                    <span
                                      className={cn(
                                        "px-1.5 py-0.5 rounded",
                                        toCfg?.badgeClass,
                                      )}
                                    >
                                      {toCfg?.label ?? entry.toStage}
                                    </span>
                                  </div>
                                ) : (
                                  <span
                                    className={cn(
                                      "text-xs px-1.5 py-0.5 rounded",
                                      toCfg?.badgeClass,
                                    )}
                                  >
                                    Created · {toCfg?.label ?? entry.toStage}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[9px] bg-[#1B4332] text-white">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-gray-500">
                                  {authorName} ·{" "}
                                  {formatDateTime(entry.changedAt as string)}
                                </span>
                              </div>
                              {entry.notes && entry.notes !== "Order created" && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  {entry.notes}
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </TabsContent>

                  {/* ─── NOTES TAB ─── */}
                  <TabsContent value="notes" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a note…"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <Button
                        onClick={handleAddNote}
                        disabled={!noteText.trim() || addingNote}
                        size="sm"
                        className="bg-[#1B4332] hover:bg-[#163829] text-white"
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        {addingNote ? "Saving…" : "Add Note"}
                      </Button>
                    </div>

                    <Separator />

                    {order.notes ? (
                      <div className="space-y-3">
                        {order.notes.split("\n\n").map((line, i) => {
                          const match = line.match(
                            /^\[(.+?)\]: ([\s\S]+)$/,
                          );
                          if (match) {
                            return (
                              <div
                                key={i}
                                className="bg-gray-50 rounded-lg p-3 text-sm"
                              >
                                <p className="text-xs text-gray-400 mb-1">
                                  {match[1]}
                                </p>
                                <p className="text-gray-800">{match[2]}</p>
                              </div>
                            );
                          }
                          return (
                            <p key={i} className="text-sm text-gray-700">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-6">
                        No notes yet
                      </p>
                    )}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
