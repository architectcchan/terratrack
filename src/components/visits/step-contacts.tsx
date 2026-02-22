"use client";

import { useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, UserPlus } from "lucide-react";
import type { ContactOption } from "./visit-log-types";
import { CONTACT_ROLES } from "./visit-log-types";
import { cn } from "@/lib/utils";

interface StepContactsProps {
  contacts: ContactOption[];
  selectedIds: string[];
  noOneAvailable: boolean;
  accountId: string;
  onToggleContact: (id: string, name: string) => void;
  onToggleNoOne: (val: boolean) => void;
  onAddContact: (contact: ContactOption) => void;
  onNext: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  buyer: "bg-blue-100 text-blue-700",
  store_manager: "bg-purple-100 text-purple-700",
  assistant_manager: "bg-indigo-100 text-indigo-700",
  budtender: "bg-green-100 text-green-700",
  owner: "bg-amber-100 text-amber-700",
  other: "bg-gray-100 text-gray-600",
};

export function StepContacts({
  contacts,
  selectedIds,
  noOneAvailable,
  accountId,
  onToggleContact,
  onToggleNoOne,
  onAddContact,
  onNext,
}: StepContactsProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newRole, setNewRole] = useState("buyer");
  const [adding, setAdding] = useState(false);

  const handleQuickAdd = useCallback(async () => {
    if (!newFirstName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: "",
          role: newRole,
        }),
      });
      if (res.ok) {
        const { contact } = await res.json();
        onAddContact(contact);
        onToggleContact(
          contact.id,
          `${contact.firstName} ${contact.lastName}`.trim()
        );
        setNewFirstName("");
        setShowQuickAdd(false);
      }
    } finally {
      setAdding(false);
    }
  }, [newFirstName, newRole, accountId, onAddContact, onToggleContact]);

  return (
    <div className="flex flex-col h-full">
      <p className="text-sm text-gray-600 mb-4">
        Who did you meet with?
      </p>

      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
        <Switch
          checked={noOneAvailable}
          onCheckedChange={onToggleNoOne}
          id="no-one"
        />
        <Label htmlFor="no-one" className="text-sm text-gray-700 cursor-pointer">
          No one available
        </Label>
      </div>

      <div
        className={cn(
          "flex-1 overflow-y-auto space-y-1 transition-opacity",
          noOneAvailable && "opacity-40 pointer-events-none"
        )}
      >
        {contacts.length === 0 && (
          <p className="text-sm text-gray-400 py-6 text-center">
            No contacts on file for this account
          </p>
        )}
        {contacts.map((contact) => {
          const checked = selectedIds.includes(contact.id);
          const roleName = CONTACT_ROLES[contact.role ?? "other"] || "Other";
          const roleColor = ROLE_COLORS[contact.role ?? "other"] || ROLE_COLORS.other;
          return (
            <button
              key={contact.id}
              type="button"
              onClick={() =>
                onToggleContact(
                  contact.id,
                  `${contact.firstName} ${contact.lastName}`.trim()
                )
              }
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left",
                checked
                  ? "bg-[#1B4332]/5 border border-[#1B4332]/20"
                  : "hover:bg-gray-50 border border-transparent"
              )}
            >
              <Checkbox checked={checked} className="pointer-events-none" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900">
                  {contact.firstName} {contact.lastName}
                </span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 border-0 ${roleColor}`}
              >
                {roleName}
              </Badge>
            </button>
          );
        })}
      </div>

      {!noOneAvailable && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          {!showQuickAdd ? (
            <button
              type="button"
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-2 text-sm text-[#1B4332] font-medium hover:text-[#1B4332]/80 transition-colors py-1"
            >
              <UserPlus className="h-4 w-4" />
              Quick Add Contact
            </button>
          ) : (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="First name"
                  className="h-9 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                />
              </div>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTACT_ROLES).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleQuickAdd}
                disabled={!newFirstName.trim() || adding}
                className="h-9 bg-[#1B4332] hover:bg-[#1B4332]/90"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100">
        <Button
          onClick={onNext}
          className="w-full h-11 bg-[#1B4332] hover:bg-[#1B4332]/90 text-sm font-medium"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
