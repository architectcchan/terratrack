"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Check, ChevronsUpDown, CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface AccountOption {
  id: string;
  name: string;
  paymentTerms: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  wholesalePrice: string;
  category: string | null;
}

interface VisitOption {
  id: string;
  checkInTime: string;
  visitType: string | null;
}

interface SampleOption {
  id: string;
  droppedOffDate: string;
  status: string;
}

interface LineItemRow {
  tempId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  discountPercent: string;
  lineTotal: number;
}

interface CreateOrderSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateOrderSheet({
  open,
  onClose,
  onCreated,
}: CreateOrderSheetProps) {
  const [accountId, setAccountId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [stage, setStage] = useState("lead");
  const [source, setSource] = useState("in_person");
  const [expectedCloseDate, setExpectedCloseDate] = useState<Date | undefined>();
  const [closeDateOpen, setCloseDateOpen] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState("cod");
  const [linkedVisitId, setLinkedVisitId] = useState("");
  const [linkedSampleId, setLinkedSampleId] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItemRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [accountSearch, setAccountSearch] = useState("");
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [visits, setVisits] = useState<VisitOption[]>([]);
  const [samples, setSamples] = useState<SampleOption[]>([]);
  const [productOpenIdx, setProductOpenIdx] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAccounts = useCallback(async (q: string) => {
    setAccountsLoading(true);
    try {
      const r = await fetch(
        `/api/accounts?search=${encodeURIComponent(q)}&limit=20`,
      );
      const data = await r.json();
      setAccountOptions(
        (data.accounts ?? []).map(
          (a: { id: string; name: string; paymentTerms?: string }) => ({
            id: a.id,
            name: a.name,
            paymentTerms: a.paymentTerms ?? null,
          }),
        ),
      );
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && accountOptions.length === 0) {
      fetchAccounts("");
    }
  }, [open, fetchAccounts, accountOptions.length]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchAccounts(accountSearch), 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [accountSearch, fetchAccounts]);

  useEffect(() => {
    fetch("/api/products?limit=200&status=active")
      .then((r) => r.json())
      .then((d) => setProductOptions(d.products ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!accountId) {
      setVisits([]);
      setSamples([]);
      return;
    }
    fetch(`/api/accounts/${accountId}/visits?limit=10`)
      .then((r) => r.json())
      .then((d) =>
        setVisits(
          (d.visits ?? []).map(
            (v: { id: string; checkInTime: string; visitType?: string }) => ({
              id: v.id,
              checkInTime: v.checkInTime,
              visitType: v.visitType ?? null,
            }),
          ),
        ),
      )
      .catch(() => {});
    fetch(`/api/accounts/${accountId}/samples?limit=10`)
      .then((r) => r.json())
      .then((d) =>
        setSamples(
          (d.samples ?? []).map(
            (s: { id: string; droppedOffDate: string; status: string }) => ({
              id: s.id,
              droppedOffDate: s.droppedOffDate,
              status: s.status,
            }),
          ),
        ),
      )
      .catch(() => {});
  }, [accountId]);

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: "",
        discountPercent: "0",
        lineTotal: 0,
      },
    ]);
  };

  const removeLineItem = (tempId: string) => {
    setLineItems((prev) => prev.filter((li) => li.tempId !== tempId));
  };

  const updateLineItem = (
    tempId: string,
    field: Partial<Omit<LineItemRow, "tempId" | "lineTotal">>,
  ) => {
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.tempId !== tempId) return li;
        const updated = { ...li, ...field };
        const up = parseFloat(updated.unitPrice) || 0;
        const qty = updated.quantity || 0;
        const disc = parseFloat(updated.discountPercent) || 0;
        updated.lineTotal = up * qty * (1 - disc / 100);
        return updated;
      }),
    );
  };

  const selectProduct = (tempId: string, product: ProductOption) => {
    updateLineItem(tempId, {
      productId: product.id,
      productName: product.name,
      unitPrice: product.wholesalePrice,
    });
    setProductOpenIdx(null);
    setProductSearch("");
  };

  const subtotal = lineItems.reduce(
    (s, li) => s + (parseFloat(li.unitPrice) || 0) * li.quantity,
    0,
  );
  const discountTotal = lineItems.reduce(
    (s, li) =>
      s +
      (parseFloat(li.unitPrice) || 0) *
        li.quantity *
        ((parseFloat(li.discountPercent) || 0) / 100),
    0,
  );
  const grandTotal = subtotal - discountTotal;

  const reset = () => {
    setAccountId("");
    setAccountName("");
    setStage("lead");
    setSource("in_person");
    setExpectedCloseDate(undefined);
    setPaymentTerms("cod");
    setLinkedVisitId("");
    setLinkedSampleId("");
    setNotes("");
    setLineItems([]);
    setAccountSearch("");
  };

  const handleSubmit = async () => {
    if (!accountId) {
      toast.error("Please select an account");
      return;
    }
    if (lineItems.length === 0) {
      toast.error("Add at least one line item");
      return;
    }
    const invalid = lineItems.find(
      (li) => !li.productId || !li.unitPrice || li.quantity < 1,
    );
    if (invalid) {
      toast.error("Complete all line items before saving");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          stage,
          source,
          expectedCloseDate: expectedCloseDate
            ? format(expectedCloseDate, "yyyy-MM-dd")
            : null,
          paymentTerms,
          linkedVisitId: linkedVisitId || null,
          linkedSampleId: linkedSampleId || null,
          notes: notes || null,
          lineItems: lineItems.map((li) => ({
            productId: li.productId,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            discountPercent: li.discountPercent || "0",
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create order");
      }

      toast.success("Order created successfully");
      reset();
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = productSearch
    ? productOptions.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(productSearch.toLowerCase()),
      )
    : productOptions;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader className="pb-4">
          <SheetTitle>Create Order</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-8">
          {/* Account */}
          <div className="space-y-1.5">
            <Label>
              Account <span className="text-red-500">*</span>
            </Label>
            <Popover open={accountsOpen} onOpenChange={setAccountsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  {accountName || "Search accounts…"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search accounts…"
                    value={accountSearch}
                    onValueChange={setAccountSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {accountsLoading ? "Loading…" : "No accounts found"}
                    </CommandEmpty>
                    <CommandGroup>
                      {accountOptions.map((acc) => (
                        <CommandItem
                          key={acc.id}
                          value={acc.name}
                          onSelect={() => {
                            setAccountId(acc.id);
                            setAccountName(acc.name);
                            if (acc.paymentTerms)
                              setPaymentTerms(acc.paymentTerms);
                            setAccountsOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              accountId === acc.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {acc.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Stage + Source */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "lead", label: "Lead" },
                    { value: "quote_sent", label: "Quote Sent" },
                    { value: "confirmed", label: "Confirmed" },
                    { value: "processing", label: "Processing" },
                    {
                      value: "ready_for_delivery",
                      label: "Ready for Delivery",
                    },
                    { value: "delivered", label: "Delivered" },
                    { value: "paid", label: "Paid" },
                  ].map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "in_person", label: "🤝 In Person" },
                    { value: "phone", label: "📞 Phone" },
                    { value: "text", label: "💬 Text" },
                    { value: "email", label: "📧 Email" },
                    { value: "leaflink", label: "🍃 LeafLink" },
                    { value: "growflow", label: "📊 GrowFlow" },
                    { value: "nabis", label: "🌿 Nabis" },
                    { value: "distru", label: "📦 Distru" },
                    { value: "other", label: "❓ Other" },
                  ].map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expected Close Date + Payment Terms */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Expected Close Date</Label>
              <Popover open={closeDateOpen} onOpenChange={setCloseDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expectedCloseDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expectedCloseDate
                      ? format(expectedCloseDate, "MMM d, yyyy")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expectedCloseDate}
                    onSelect={(d) => {
                      setExpectedCloseDate(d);
                      setCloseDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "cod", label: "COD" },
                    { value: "net_15", label: "Net 15" },
                    { value: "net_30", label: "Net 30" },
                    { value: "net_45", label: "Net 45" },
                    { value: "custom", label: "Custom" },
                  ].map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Line Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Product
              </Button>
            </div>

            {lineItems.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
                No products added yet. Click &ldquo;Add Product&rdquo; to begin.
              </p>
            )}

            <div className="space-y-2">
              {lineItems.map((li, idx) => (
                <div
                  key={li.tempId}
                  className="grid grid-cols-[1fr_70px_90px_70px_auto] gap-2 items-start"
                >
                  {/* Product select */}
                  <Popover
                    open={productOpenIdx === idx}
                    onOpenChange={(o) => {
                      setProductOpenIdx(o ? idx : null);
                      if (!o) setProductSearch("");
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal h-9 text-sm truncate"
                      >
                        <span className="truncate">
                          {li.productName || "Select product…"}
                        </span>
                        <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50 flex-shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search products…"
                          value={productSearch}
                          onValueChange={setProductSearch}
                        />
                        <CommandList className="max-h-48">
                          <CommandEmpty>No products found</CommandEmpty>
                          <CommandGroup>
                            {filteredProducts.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.name}
                                onSelect={() => selectProduct(li.tempId, p)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3 w-3",
                                    li.productId === p.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div>
                                  <div className="text-sm">{p.name}</div>
                                  <div className="text-xs text-gray-400">
                                    {p.sku} · $
                                    {parseFloat(p.wholesalePrice).toFixed(2)}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Qty */}
                  <Input
                    type="number"
                    min={1}
                    value={li.quantity}
                    onChange={(e) =>
                      updateLineItem(li.tempId, {
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    placeholder="Qty"
                    className="h-9 text-sm"
                  />

                  {/* Unit price */}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={li.unitPrice}
                      onChange={(e) =>
                        updateLineItem(li.tempId, { unitPrice: e.target.value })
                      }
                      placeholder="0.00"
                      className="h-9 text-sm pl-5"
                    />
                  </div>

                  {/* Discount */}
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={li.discountPercent}
                      onChange={(e) =>
                        updateLineItem(li.tempId, {
                          discountPercent: e.target.value,
                        })
                      }
                      placeholder="0"
                      className="h-9 text-sm pr-5"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      %
                    </span>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeLineItem(li.tempId)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Column headers */}
            {lineItems.length > 0 && (
              <div className="grid grid-cols-[1fr_70px_90px_70px_auto] gap-2 text-xs text-gray-400 px-0">
                <span>Product</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Disc %</span>
                <span />
              </div>
            )}

            {/* Totals */}
            {lineItems.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>
                    ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Discount</span>
                    <span className="text-red-600">
                      -${discountTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 border-t pt-1.5">
                  <span>Grand Total</span>
                  <span>
                    ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any notes for this order…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Link to Visit */}
          {visits.length > 0 && (
            <div className="space-y-1.5">
              <Label>Link to Visit (optional)</Label>
              <Select
                value={linkedVisitId || "none"}
                onValueChange={(v) => setLinkedVisitId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a recent visit…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {visits.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {new Date(v.checkInTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {v.visitType && ` · ${v.visitType.replace(/_/g, " ")}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Link to Sample */}
          {samples.length > 0 && (
            <div className="space-y-1.5">
              <Label>Link to Sample (optional)</Label>
              <Select
                value={linkedSampleId || "none"}
                onValueChange={(v) => setLinkedSampleId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sample…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {samples.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {new Date(
                        s.droppedOffDate + "T00:00:00",
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      · {s.status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#D4A843] hover:bg-[#c49a38] text-white"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create Order"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
