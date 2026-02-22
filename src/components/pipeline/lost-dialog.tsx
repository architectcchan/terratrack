"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LOSS_REASON_OPTIONS, type OrderStage } from "@/types";

interface LostDialogProps {
  open: boolean;
  targetStage: "lost" | "cancelled" | null;
  onConfirm: (stage: OrderStage, lossReason: string | null, notes: string) => Promise<void>;
  onCancel: () => void;
}

export function LostDialog({
  open,
  targetStage,
  onConfirm,
  onCancel,
}: LostDialogProps) {
  const [lossReason, setLossReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!targetStage) return;
    setLoading(true);
    try {
      await onConfirm(
        targetStage,
        lossReason || null,
        notes,
      );
      setLossReason("");
      setNotes("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setLossReason("");
    setNotes("");
    onCancel();
  };

  const isLost = targetStage === "lost";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isLost ? "Mark as Lost" : "Mark as Cancelled"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLost && (
            <div className="space-y-1.5">
              <Label>Loss Reason</Label>
              <Select value={lossReason} onValueChange={setLossReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  {LOSS_REASON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder={
                isLost
                  ? "Any additional context about why this was lost…"
                  : "Reason for cancellation…"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || (isLost && !lossReason)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading
              ? "Saving…"
              : isLost
                ? "Mark as Lost"
                : "Mark as Cancelled"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
