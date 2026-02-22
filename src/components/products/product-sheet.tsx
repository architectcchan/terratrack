"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ProductListItem } from "@/types";

// ─── Form schema ─────────────────────────────────────────────────────────────

const NONE = "__none__";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string(),
  subcategory: z.string(),
  status: z.enum(["active", "limited", "out_of_stock", "discontinued"]),
  strainName: z.string(),
  strainType: z.string(),
  description: z.string(),
  thcPercentMin: z.string(),
  thcPercentMax: z.string(),
  cbdPercentMin: z.string(),
  cbdPercentMax: z.string(),
  growType: z.string(),
  turnaroundTime: z.string(),
  minimumOrder: z.string(),
  wholesalePrice: z
    .string()
    .min(1, "Wholesale price is required")
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0,
      "Must be a valid price",
    ),
  msrp: z.string(),
  availableInventory: z.string(),
  unitSize: z.string().min(1, "Unit size is required"),
  imageUrl: z
    .union([z.literal(""), z.string().url("Must be a valid URL")])
    .optional(),
  coaUrl: z
    .union([z.literal(""), z.string().url("Must be a valid URL")])
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const defaultValues: FormValues = {
  name: "",
  sku: "",
  category: NONE,
  subcategory: "",
  status: "active",
  strainName: "",
  strainType: NONE,
  description: "",
  thcPercentMin: "",
  thcPercentMax: "",
  cbdPercentMin: "",
  cbdPercentMax: "",
  growType: NONE,
  turnaroundTime: "",
  minimumOrder: "",
  wholesalePrice: "",
  msrp: "",
  availableInventory: "",
  unitSize: "",
  imageUrl: "",
  coaUrl: "",
};

function productToFormValues(p: ProductListItem): FormValues {
  return {
    name: p.name,
    sku: p.sku,
    category: p.category ?? NONE,
    subcategory: p.subcategory ?? "",
    status: (p.status ?? "active") as FormValues["status"],
    strainName: p.strainName ?? "",
    strainType: p.strainType ?? NONE,
    description: p.description ?? "",
    thcPercentMin: p.thcPercentMin ?? "",
    thcPercentMax: p.thcPercentMax ?? "",
    cbdPercentMin: p.cbdPercentMin ?? "",
    cbdPercentMax: p.cbdPercentMax ?? "",
    growType: p.growType ?? NONE,
    turnaroundTime: p.turnaroundTime ?? "",
    minimumOrder: p.minimumOrder ?? "",
    wholesalePrice: p.wholesalePrice,
    msrp: p.msrp ?? "",
    availableInventory:
      p.availableInventory != null ? String(p.availableInventory) : "",
    unitSize: p.unitSize,
    imageUrl: p.imageUrl ?? "",
    coaUrl: p.coaUrl ?? "",
  };
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        {title}
      </p>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductListItem | null;
  onSaved: (product: ProductListItem) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductSheet({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductSheetProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Reset form when sheet opens or product changes
  useEffect(() => {
    if (open) {
      form.reset(product ? productToFormValues(product) : defaultValues);
    }
  }, [open, product, form]);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        sku: data.sku,
        category: data.category === NONE ? null : data.category,
        subcategory: data.subcategory || null,
        status: data.status,
        strainName: data.strainName || null,
        strainType: data.strainType === NONE ? null : data.strainType,
        description: data.description || null,
        thcPercentMin: data.thcPercentMin || null,
        thcPercentMax: data.thcPercentMax || null,
        cbdPercentMin: data.cbdPercentMin || null,
        cbdPercentMax: data.cbdPercentMax || null,
        growType: data.growType === NONE ? null : data.growType,
        turnaroundTime: data.turnaroundTime || null,
        minimumOrder: data.minimumOrder || null,
        wholesalePrice: data.wholesalePrice,
        msrp: data.msrp || null,
        availableInventory: data.availableInventory || null,
        unitSize: data.unitSize,
        imageUrl: data.imageUrl || null,
        coaUrl: data.coaUrl || null,
      };

      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Request failed");
      }

      const json = await res.json();
      toast.success(product ? "Product updated" : "Product created");
      onSaved(json.product as ProductListItem);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0 gap-0"
      >
        <SheetHeader className="px-6 py-5 border-b border-gray-100">
          <SheetTitle className="text-base font-semibold">
            {product ? "Edit Product" : "Add Product"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form
              id="product-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="px-6 py-4 space-y-4"
            >
              {/* ── Basic Info ─────────────────────────────── */}
              <SectionHeader title="Basic Info" />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Product Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Blue Dream Flower" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SKU + Status row */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        SKU <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="BD-3.5-OZ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="limited">Limited</SelectItem>
                          <SelectItem value="out_of_stock">
                            Out of Stock
                          </SelectItem>
                          <SelectItem value="discontinued">
                            Discontinued
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category + Subcategory row */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>None</SelectItem>
                          <SelectItem value="flower">Flower</SelectItem>
                          <SelectItem value="pre_roll">Pre-Roll</SelectItem>
                          <SelectItem value="edible">Edible</SelectItem>
                          <SelectItem value="vape">Vape</SelectItem>
                          <SelectItem value="concentrate">
                            Concentrate
                          </SelectItem>
                          <SelectItem value="topical">Topical</SelectItem>
                          <SelectItem value="tincture">Tincture</SelectItem>
                          <SelectItem value="accessory">Accessory</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Indoor, Small Batch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* ── Strain Details ──────────────────────────── */}
              <SectionHeader title="Strain Details" />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="strainName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strain Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Blue Dream" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strainType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strain Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>None</SelectItem>
                          <SelectItem value="indica">Indica</SelectItem>
                          <SelectItem value="sativa">Sativa</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="cbd">CBD</SelectItem>
                          <SelectItem value="blend">Blend</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tasting notes, effects, growing details…"
                        rows={3}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* ── Cannabinoids ────────────────────────────── */}
              <SectionHeader title="Cannabinoids" />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="thcPercentMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>THC Min %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          placeholder="e.g. 28"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thcPercentMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>THC Max %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          placeholder="e.g. 32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cbdPercentMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CBD Min %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          placeholder="e.g. 0.1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cbdPercentMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CBD Max %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          placeholder="e.g. 0.5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* ── Growing Info ─────────────────────────────── */}
              <SectionHeader title="Growing Info" />

              <FormField
                control={form.control}
                name="growType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grow Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        <SelectItem value="Indoor Hydro">Indoor Hydro</SelectItem>
                        <SelectItem value="Outdoor Sun-Grown">
                          Outdoor Sun-Grown
                        </SelectItem>
                        <SelectItem value="Living Soil">Living Soil</SelectItem>
                        <SelectItem value="Greenhouse">Greenhouse</SelectItem>
                        <SelectItem value="Mixed Light">Mixed Light</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="turnaroundTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turnaround Time</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 3-5 business days" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimumOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Order</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 5 units" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* ── Pricing ──────────────────────────────────── */}
              <SectionHeader title="Pricing" />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="wholesalePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Wholesale Price ($){" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="msrp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MSRP ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* ── Inventory ────────────────────────────────── */}
              <SectionHeader title="Inventory" />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="availableInventory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Units</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          min={0}
                          placeholder="e.g. 50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Unit Size <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 3.5g, 1oz, 10pk" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* ── Assets ───────────────────────────────────── */}
              <SectionHeader title="Assets" />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Image URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coaUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>COA URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bottom padding so last field isn't behind the footer */}
              <div className="h-4" />
            </form>
          </Form>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="product-form"
            disabled={submitting}
            className="flex-1 sm:flex-none bg-[#1B4332] hover:bg-[#1B4332]/90 text-white"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {product ? "Save Changes" : "Add Product"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
