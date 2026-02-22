"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Star, Phone, Mail, Pencil, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContactRow } from "@/types";

const ROLE_LABELS: Record<string, string> = {
  buyer: "Buyer",
  store_manager: "Store Manager",
  assistant_manager: "Asst. Manager",
  budtender: "Budtender",
  owner: "Owner",
  other: "Other",
};

const ROLE_COLORS: Record<string, string> = {
  buyer: "bg-blue-100 text-blue-700",
  store_manager: "bg-purple-100 text-purple-700",
  assistant_manager: "bg-indigo-100 text-indigo-700",
  budtender: "bg-teal-100 text-teal-700",
  owner: "bg-amber-100 text-amber-700",
  other: "bg-gray-100 text-gray-700",
};

const CONTACT_METHOD_LABELS: Record<string, string> = {
  phone: "Phone",
  email: "Email",
  text: "Text",
  in_person: "In Person",
};

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface ContactFormState {
  firstName: string;
  lastName: string;
  role: string;
  isPrimaryDecisionMaker: boolean;
  phone: string;
  email: string;
  preferredContactMethod: string;
  bestVisitDays: string[];
  bestVisitTimes: string;
  notes: string;
}

const EMPTY_FORM: ContactFormState = {
  firstName: "",
  lastName: "",
  role: "buyer",
  isPrimaryDecisionMaker: false,
  phone: "",
  email: "",
  preferredContactMethod: "phone",
  bestVisitDays: [],
  bestVisitTimes: "",
  notes: "",
};

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  initial?: ContactRow | null;
  onSaved: () => void;
}

function ContactModal({
  open,
  onClose,
  accountId,
  initial,
  onSaved,
}: ContactModalProps) {
  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          firstName: initial.firstName,
          lastName: initial.lastName,
          role: initial.role ?? "buyer",
          isPrimaryDecisionMaker: initial.isPrimaryDecisionMaker ?? false,
          phone: initial.phone ?? "",
          email: initial.email ?? "",
          preferredContactMethod: initial.preferredContactMethod ?? "phone",
          bestVisitDays: initial.bestVisitDays ?? [],
          bestVisitTimes: initial.bestVisitTimes ?? "",
          notes: initial.notes ?? "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError("");
    }
  }, [open, initial]);

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      bestVisitDays: f.bestVisitDays.includes(day)
        ? f.bestVisitDays.filter((d) => d !== day)
        : [...f.bestVisitDays, day],
    }));
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const url = initial
        ? `/api/contacts/${initial.id}`
        : `/api/accounts/${accountId}/contacts`;
      const method = initial ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone || null,
          email: form.email || null,
          bestVisitTimes: form.bestVisitTimes || null,
          notes: form.notes || null,
          bestVisitDays: form.bestVisitDays.length > 0 ? form.bestVisitDays : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save contact.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Contact" : "Add Contact"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                placeholder="Jane"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
                placeholder="Smith"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Contact</Label>
              <Select
                value={form.preferredContactMethod}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, preferredContactMethod: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTACT_METHOD_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="(555) 555-5555"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="jane@store.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Best Days to Visit</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    form.bestVisitDays.includes(day)
                      ? "bg-[#1B4332] text-white border-[#1B4332]"
                      : "border-gray-300 text-gray-600 hover:border-[#1B4332]"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Best Times</Label>
            <Input
              value={form.bestVisitTimes}
              onChange={(e) =>
                setForm((f) => ({ ...f, bestVisitTimes: e.target.value }))
              }
              placeholder="e.g. 10am–2pm, after 3pm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="decision-maker"
              checked={form.isPrimaryDecisionMaker}
              onCheckedChange={(v) =>
                setForm((f) => ({
                  ...f,
                  isPrimaryDecisionMaker: v === true,
                }))
              }
            />
            <Label htmlFor="decision-maker" className="cursor-pointer">
              Primary decision maker
            </Label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#1B4332] hover:bg-[#163728] text-white"
          >
            {saving ? "Saving..." : initial ? "Save Changes" : "Add Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ContactsTabProps {
  accountId: string;
}

export function ContactsTab({ accountId }: ContactsTabProps) {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactRow | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/contacts`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setContacts(data.contacts);
    } catch {
      setError("Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleDeactivate = async (contactId: string) => {
    await fetch(`/api/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    fetchContacts();
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
        <Button
          size="sm"
          className="bg-[#1B4332] hover:bg-[#163728] text-white"
          onClick={() => {
            setEditingContact(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No contacts yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Name</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Role</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Phone</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Email</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Preferred</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Best Days</th>
                  <th className="text-left font-medium text-gray-500 pb-2 pr-4">Best Times</th>
                  <th className="text-right font-medium text-gray-500 pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className={`border-b border-gray-100 ${
                      !contact.isActive ? "opacity-40" : ""
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        {contact.isPrimaryDecisionMaker && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                        <span className="font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        className={`text-xs ${ROLE_COLORS[contact.role ?? "other"] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {ROLE_LABELS[contact.role ?? "other"] ?? contact.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {contact.phone ? (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1 text-gray-600 hover:text-[#1B4332]"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {contact.phone}
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1 text-gray-600 hover:text-[#1B4332] truncate max-w-[160px]"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {contact.preferredContactMethod ? (
                        <Badge variant="outline" className="text-xs">
                          {CONTACT_METHOD_LABELS[contact.preferredContactMethod] ??
                            contact.preferredContactMethod}
                        </Badge>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 text-xs">
                      {contact.bestVisitDays?.join(", ") || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 text-xs">
                      {contact.bestVisitTimes || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingContact(contact);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {contact.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-600"
                            onClick={() => handleDeactivate(contact.id)}
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`border border-gray-200 rounded-lg p-3 space-y-2 ${
                  !contact.isActive ? "opacity-40" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {contact.isPrimaryDecisionMaker && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      )}
                      <span className="font-medium text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </span>
                    </div>
                    <Badge
                      className={`text-xs mt-1 ${ROLE_COLORS[contact.role ?? "other"] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {ROLE_LABELS[contact.role ?? "other"] ?? contact.role}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingContact(contact);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {contact.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400"
                        onClick={() => handleDeactivate(contact.id)}
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {contact.email}
                    </a>
                  )}
                </div>
                {(contact.bestVisitDays?.length || contact.bestVisitTimes) && (
                  <p className="text-xs text-gray-500">
                    Best: {contact.bestVisitDays?.join(", ")}
                    {contact.bestVisitTimes ? ` · ${contact.bestVisitTimes}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <ContactModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingContact(null);
        }}
        accountId={accountId}
        initial={editingContact}
        onSaved={fetchContacts}
      />
    </div>
  );
}
