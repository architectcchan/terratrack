"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContactRow } from "@/types";

interface ProductLine {
  productName: string;
  quantity: number;
  unitSize: string;
}

interface DropSampleModalProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  contacts: ContactRow[];
  onSuccess: () => void;
}

export function DropSampleModal({
  open,
  onClose,
  accountId,
  contacts,
  onSuccess,
}: DropSampleModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const [droppedOffDate, setDroppedOffDate] = useState(today);
  const [recipientContactId, setRecipientContactId] = useState<string>("");
  const [feedbackDueDate, setFeedbackDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<ProductLine[]>([
    { productName: "", quantity: 1, unitSize: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addProduct = () => {
    setProducts((prev) => [...prev, { productName: "", quantity: 1, unitSize: "" }]);
  };

  const removeProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (
    index: number,
    field: keyof ProductLine,
    value: string | number,
  ) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const handleSubmit = async () => {
    if (!droppedOffDate) {
      setError("Drop date is required.");
      return;
    }
    const validProducts = products.filter((p) => p.productName.trim());
    if (validProducts.length === 0) {
      setError("At least one product is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          droppedOffDate,
          productsSampled: validProducts,
          recipientContactId: recipientContactId || null,
          feedbackDueDate: feedbackDueDate || null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create sample.");
        return;
      }

      onSuccess();
      onClose();
      setProducts([{ productName: "", quantity: 1, unitSize: "" }]);
      setNotes("");
      setFeedbackDueDate("");
      setRecipientContactId("");
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
          <DialogTitle>Drop Sample</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="drop-date">Drop Date *</Label>
              <Input
                id="drop-date"
                type="date"
                value={droppedOffDate}
                onChange={(e) => setDroppedOffDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feedback-due">Feedback Due</Label>
              <Input
                id="feedback-due"
                type="date"
                value={feedbackDueDate}
                onChange={(e) => setFeedbackDueDate(e.target.value)}
              />
            </div>
          </div>

          {contacts.length > 0 && (
            <div className="space-y-1.5">
              <Label>Recipient</Label>
              <Select
                value={recipientContactId}
                onValueChange={setRecipientContactId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {contacts
                    .filter((c) => c.isActive)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                        {c.role ? ` — ${c.role.replace(/_/g, " ")}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Products Sampled *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addProduct}
                className="h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Product
              </Button>
            </div>

            {products.map((product, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-end"
              >
                <div className="space-y-1">
                  {index === 0 && (
                    <span className="text-xs text-muted-foreground">Product Name</span>
                  )}
                  <Input
                    placeholder="e.g. Purple Dragon OG"
                    value={product.productName}
                    onChange={(e) =>
                      updateProduct(index, "productName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  {index === 0 && (
                    <span className="text-xs text-muted-foreground">Qty</span>
                  )}
                  <Input
                    type="number"
                    min="1"
                    value={product.quantity}
                    onChange={(e) =>
                      updateProduct(index, "quantity", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div className="space-y-1">
                  {index === 0 && (
                    <span className="text-xs text-muted-foreground">Size</span>
                  )}
                  <Input
                    placeholder="3.5g"
                    value={product.unitSize}
                    onChange={(e) =>
                      updateProduct(index, "unitSize", e.target.value)
                    }
                  />
                </div>
                <div className={index === 0 ? "mt-5" : ""}>
                  {products.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => removeProduct(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sample-notes">Notes</Label>
            <Textarea
              id="sample-notes"
              placeholder="Any notes about the sample drop..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
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
            className="bg-[#D4A843] hover:bg-[#c49b3b] text-white"
          >
            {saving ? "Saving..." : "Drop Sample"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
