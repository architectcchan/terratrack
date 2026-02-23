"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const NONE = "__none__";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  dbaName: z.string().max(255).optional(),
  addressLine1: z.string().min(1, "Address Line 1 is required").max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z
    .string()
    .min(1, "State is required")
    .length(2, "Must be a 2-letter state code"),
  zip: z.string().min(5, "ZIP code is required").max(10),
  phone: z.string().max(20).optional(),
  email: z
    .union([z.literal(""), z.string().email("Invalid email format")])
    .optional(),
  website: z
    .union([
      z.literal(""),
      z.string().url("Please enter a valid URL (e.g., https://example.com)"),
    ])
    .optional(),
  licenseNumber: z.string().max(100).optional(),
  licenseType: z.enum([
    "retailer",
    "microbusiness",
    "delivery",
    "consumption_lounge",
    "other",
  ]),
  licenseExpiration: z.date().optional(),
  revenueTier: z.enum(["A", "B", "C", "D", "unranked"]),
  chainId: z.string().optional(),
  assignedRepId: z.string().optional(),
  territoryId: z.string().optional(),
  status: z.enum([
    "prospect",
    "sample_sent",
    "active",
    "at_risk",
    "dormant",
    "churned",
  ]),
  paymentTerms: z.enum(["cod", "net_15", "net_30", "net_45", "custom"]),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  googlePlaceId: z.string().max(255).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Rep {
  id: string;
  firstName: string;
  lastName: string;
}

interface FormOption {
  id: string;
  name: string;
}

export interface CreateAccountFormProps {
  chains: FormOption[];
  reps: Rep[];
  territories: FormOption[];
}

export function CreateAccountForm({
  chains,
  reps,
  territories,
}: CreateAccountFormProps) {
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      dbaName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "WA",
      zip: "",
      phone: "",
      email: "",
      website: "",
      licenseNumber: "",
      licenseType: "retailer",
      licenseExpiration: undefined,
      revenueTier: "unranked",
      chainId: NONE,
      assignedRepId: NONE,
      territoryId: NONE,
      status: "prospect",
      paymentTerms: "cod",
      notes: "",
      tags: [],
      googlePlaceId: "",
    },
  });

  const tags = form.watch("tags");

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        form.setValue("tags", [...tags, newTag]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    form.setValue(
      "tags",
      tags.filter((t) => t !== tag),
    );
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        dbaName: values.dbaName || null,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2 || null,
        city: values.city,
        state: values.state,
        zip: values.zip,
        phone: values.phone || null,
        email: values.email || null,
        website: values.website || null,
        licenseNumber: values.licenseNumber || null,
        licenseType: values.licenseType,
        licenseExpiration: values.licenseExpiration
          ? format(values.licenseExpiration, "yyyy-MM-dd")
          : null,
        status: values.status,
        revenueTier: values.revenueTier,
        chainId:
          values.chainId === NONE || !values.chainId ? null : values.chainId,
        assignedRepId:
          values.assignedRepId === NONE || !values.assignedRepId
            ? null
            : values.assignedRepId,
        territoryId:
          values.territoryId === NONE || !values.territoryId
            ? null
            : values.territoryId,
        paymentTerms: values.paymentTerms,
        notes: values.notes || null,
        tags: values.tags.length > 0 ? values.tags : null,
        googlePlaceId: values.googlePlaceId || null,
      };

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("Failed to create account", {
          description: err.error ?? "An unexpected error occurred.",
        });
        return;
      }

      const data = await res.json();
      toast.success("Account created", {
        description: `${values.name} has been added to your CRM.`,
      });
      router.push(`/dashboard/accounts/${data.account.id}`);
    } catch {
      toast.error("Failed to create account", {
        description: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Section 1: Dispensary Information ── */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1B4332]">
            Dispensary Information
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Green Leaf Dispensary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dbaName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    DBA Name{" "}
                    <span className="text-xs font-normal text-gray-400">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Doing business as…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    Address Line 1 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Suite 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    City <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Seattle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      State <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="WA"
                        maxLength={2}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        className="uppercase"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      ZIP <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="98101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(206) 555-0100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="buyer@dispensary.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://dispensary.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden Google Place ID — pre-populated by future Places integration */}
            <FormField
              control={form.control}
              name="googlePlaceId"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ── Section 2: License & Classification ── */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1B4332]">
            License &amp; Classification
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl>
                    <Input placeholder="420-LIC-12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Type</FormLabel>
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
                      <SelectItem value="retailer">Retailer</SelectItem>
                      <SelectItem value="microbusiness">
                        Microbusiness
                      </SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="consumption_lounge">
                        Consumption Lounge
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenseExpiration"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>License Expiration</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="revenueTier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revenue Tier</FormLabel>
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
                      <SelectItem value="A">A — Top Revenue</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D — Lowest Revenue</SelectItem>
                      <SelectItem value="unranked">Unranked</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>A = Top revenue, D = Lowest</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chainId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chain</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? NONE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {chains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Tags</FormLabel>
                  <Input
                    placeholder="Type a tag and press Enter to add"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                  {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-0.5 rounded hover:text-red-500 transition-colors"
                            aria-label={`Remove tag ${tag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ── Section 3: Assignment ── */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1B4332]">
            Assignment
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="assignedRepId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Rep</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? NONE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Unassigned</SelectItem>
                      {reps.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id}>
                          {rep.firstName} {rep.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="territoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Territory</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? NONE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {territories.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="sample_sent">Sample Sent</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="at_risk">At Risk</SelectItem>
                      <SelectItem value="dormant">Dormant</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
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
                      <SelectItem value="cod">COD</SelectItem>
                      <SelectItem value="net_15">Net 15</SelectItem>
                      <SelectItem value="net_30">Net 30</SelectItem>
                      <SelectItem value="net_45">Net 45</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ── Section 4: Notes ── */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1B4332]">
            Notes
          </h2>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Any additional notes about this account…"
                    className="min-h-[120px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* ── Actions ── */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/accounts">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#D4A843] text-white hover:bg-[#C49733] focus-visible:ring-[#D4A843]"
          >
            {isSubmitting ? "Saving…" : "Save Account"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
