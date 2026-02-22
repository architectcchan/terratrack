"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { AccountDetail } from "@/types";

const ORDERING_METHODS = [
  { value: "email", label: "Email" },
  { value: "growflow", label: "GrowFlow" },
  { value: "leaflink", label: "LeafLink" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Text" },
  { value: "in_person", label: "In Person" },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "cod", label: "COD" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "custom", label: "Custom" },
];

interface PreferencesTabProps {
  account: AccountDetail;
  onAccountUpdate: (patch: Partial<AccountDetail>) => void;
}

export function PreferencesTab({ account, onAccountUpdate }: PreferencesTabProps) {
  const [notes, setNotes] = useState(account.notes ?? "");
  const [paymentTerms, setPaymentTerms] = useState(account.paymentTerms ?? "cod");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes || null,
          paymentTerms,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save.");
        return;
      }

      const data = await res.json();
      onAccountUpdate(data.account);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900">Account Preferences</h3>
        <p className="text-xs text-gray-500">
          Store-level preferences and notes for this account.
        </p>
      </div>

      <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-5">
        <div className="space-y-1.5">
          <Label>Payment Terms</Label>
          <Select value={paymentTerms} onValueChange={setPaymentTerms}>
            <SelectTrigger className="max-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TERMS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pref-notes">General Notes</Label>
          <Textarea
            id="pref-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Add any notes about this account — buyer preferences, ordering method, pricing notes, store demographics, best visit times, etc.`}
            rows={8}
            className="resize-y"
          />
          <p className="text-xs text-gray-400">
            Use this field for ordering preferences, pricing notes, store profile, and any other account-level context.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1B4332] hover:bg-[#163728] text-white"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">✓ Saved</span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900">Contact Preferences</h3>
        <p className="text-xs text-gray-500">
          Manage individual contact preferences in the{" "}
          <span className="font-medium text-gray-700">Contacts tab</span>.
          Each contact has their own preferred contact method, best visit days,
          and best times.
        </p>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900">Quick Reference</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">License Type</span>
            <span className="text-gray-900 capitalize">
              {account.licenseType?.replace(/_/g, " ") ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">License Number</span>
            <span className="text-gray-900">{account.licenseNumber ?? "—"}</span>
          </div>
          {account.licenseExpiration && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">License Expiration</span>
              <span className="text-gray-900">
                {new Date(
                  account.licenseExpiration + "T00:00:00",
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Tags</span>
            <span className="text-gray-900">
              {account.tags && account.tags.length > 0
                ? account.tags.join(", ")
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
