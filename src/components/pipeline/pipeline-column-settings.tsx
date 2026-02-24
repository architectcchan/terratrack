"use client";

import { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  type OrderStage,
  STAGE_CONFIG,
  ACTIVE_STAGES,
} from "@/types";
import type { PipelineSettings } from "@/app/api/org/pipeline-settings/route";
import { cn } from "@/lib/utils";

interface PipelineColumnSettingsProps {
  open: boolean;
  onClose: () => void;
  pipelineStages: PipelineSettings | null;
  onSaved: (settings: PipelineSettings) => void;
}

function getDefaultOrder(): OrderStage[] {
  return [...ACTIVE_STAGES];
}

function getLabel(stage: OrderStage, labels?: Record<string, string>): string {
  return labels?.[stage] ?? STAGE_CONFIG[stage].label;
}

export function PipelineColumnSettings({
  open,
  onClose,
  pipelineStages,
  onSaved,
}: PipelineColumnSettingsProps) {
  const [order, setOrder] = useState<OrderStage[]>(() =>
    pipelineStages?.order?.length
      ? (pipelineStages.order as OrderStage[])
      : getDefaultOrder(),
  );
  const [labels, setLabels] = useState<Record<string, string>>(
    pipelineStages?.labels ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [editingStage, setEditingStage] = useState<OrderStage | null>(null);

  useEffect(() => {
    if (open) {
      setOrder(
        pipelineStages?.order?.length
          ? (pipelineStages.order as OrderStage[])
          : getDefaultOrder(),
      );
      setLabels(pipelineStages?.labels ?? {});
    }
  }, [open, pipelineStages]);

  const hiddenStages = ACTIVE_STAGES.filter((s) => !order.includes(s));

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...order];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setOrder(next);
  };

  const moveDown = (index: number) => {
    if (index >= order.length - 1) return;
    const next = [...order];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setOrder(next);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const fromIndex = result.source.index;
    const toIndex = result.destination.index;
    if (fromIndex === toIndex) return;
    const next = [...order];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    setOrder(next);
  };

  const removeColumn = (stage: OrderStage) => {
    setOrder(order.filter((s) => s !== stage));
  };

  const addColumn = (stage: OrderStage) => {
    const idx = ACTIVE_STAGES.indexOf(stage);
    const insertBefore = order.find((o) => ACTIVE_STAGES.indexOf(o) > idx);
    if (insertBefore) {
      const i = order.indexOf(insertBefore);
      setOrder([...order.slice(0, i), stage, ...order.slice(i)]);
    } else {
      setOrder([...order, stage]);
    }
  };

  const updateLabel = (stage: OrderStage, value: string) => {
    if (value.trim()) {
      setLabels((prev) => ({ ...prev, [stage]: value.trim() }));
    } else {
      setLabels((prev) => {
        const next = { ...prev };
        delete next[stage];
        return next;
      });
    }
    setEditingStage(null);
  };

  const handleReset = () => {
    setOrder(getDefaultOrder());
    setLabels({});
    setEditingStage(null);
    toast.success("Reset to default columns");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/org/pipeline-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order, labels }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      const data = await res.json();
      onSaved(data.pipelineStages);
      toast.success("Pipeline columns updated");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-md flex flex-col"
        showCloseButton={true}
      >
        <SheetHeader>
          <SheetTitle>Pipeline columns</SheetTitle>
          <p className="text-sm text-gray-500 mt-1">
            Reorder, rename, or hide columns. Changes apply to your pipeline
            board.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Visible columns */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Visible columns (drag to reorder)
            </h3>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="pipeline-columns">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-1"
                  >
                    {order.map((stage, index) => (
                      <Draggable
                        key={stage}
                        draggableId={stage}
                        index={index}
                      >
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 group",
                              snap.isDragging && "shadow-lg ring-2 ring-[#1B4332]/20",
                            )}
                          >
                            <div
                              {...prov.dragHandleProps}
                              className="flex items-center shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 rounded hover:bg-gray-100"
                              aria-label="Drag to reorder"
                            >
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex flex-col shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => moveUp(index)}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => moveDown(index)}
                                disabled={index === order.length - 1}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            {editingStage === stage ? (
                              <div
                                className="flex-1 min-w-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Input
                                  className="h-8 text-sm w-full"
                                  defaultValue={getLabel(stage, labels)}
                                  autoFocus
                                  onBlur={(e) => updateLabel(stage, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      updateLabel(stage, (e.target as HTMLInputElement).value);
                                    }
                                    if (e.key === "Escape") {
                                      setEditingStage(null);
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="flex-1 min-w-0 text-left text-sm font-medium text-gray-900 truncate hover:text-[#1B4332] py-1"
                                onClick={() => setEditingStage(stage)}
                              >
                                {getLabel(stage, labels)}
                              </button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0 text-gray-400 hover:text-red-600"
                              onClick={() => removeColumn(stage)}
                              title="Remove column"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Hidden columns - add back */}
          {hiddenStages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Hidden columns
              </h3>
              <div className="flex flex-wrap gap-2">
                {hiddenStages.map((stage) => (
                  <Button
                    key={stage}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => addColumn(stage)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {getLabel(stage, labels)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset to default
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1B4332] hover:bg-[#163028] text-white flex-1"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
