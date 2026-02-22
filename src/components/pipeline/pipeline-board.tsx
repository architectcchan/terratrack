"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, TrendingUp, ShoppingCart, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  type PipelineOrder,
  type OrderStage,
  STAGE_CONFIG,
  ACTIVE_STAGES,
  CLOSED_STAGES,
} from "@/types";
import { OrderCard } from "./order-card";
import { LostDialog } from "./lost-dialog";
import { CreateOrderSheet } from "./create-order-sheet";
import { OrderDetailSheet } from "./order-detail-sheet";
import { cn } from "@/lib/utils";

interface PendingMove {
  orderId: string;
  fromStage: OrderStage;
  toStage: "lost" | "cancelled";
}

interface RepOption {
  id: string;
  name: string;
}

interface AccountOption {
  id: string;
  name: string;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
      <div className="p-2 bg-[#1B4332]/10 rounded-lg flex-shrink-0">
        <Icon className="h-4 w-4 text-[#1B4332]" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export function PipelineBoard() {
  const [orders, setOrders] = useState<PipelineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [filterRep, setFilterRep] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [repOptions, setRepOptions] = useState<RepOption[]>([]);
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);

  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);

  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const [showClosedSection, setShowClosedSection] = useState(false);

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRep !== "all") params.set("rep_id", filterRep);
      if (filterAccount !== "all") params.set("account_id", filterAccount);
      if (filterSource !== "all") params.set("source", filterSource);

      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      const fetchedOrders: PipelineOrder[] = data.orders ?? [];
      setOrders(fetchedOrders);

      // Derive filter options from data
      const seenReps = new Map<string, string>();
      const seenAccounts = new Map<string, string>();
      fetchedOrders.forEach((o) => {
        if (o.repId) {
          seenReps.set(
            o.repId,
            [o.repFirstName, o.repLastName].filter(Boolean).join(" "),
          );
        }
        if (o.accountId && o.accountName) {
          seenAccounts.set(o.accountId, o.accountName);
        }
      });
      setRepOptions(
        Array.from(seenReps.entries()).map(([id, name]) => ({ id, name })),
      );
      setAccountOptions(
        Array.from(seenAccounts.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [filterRep, filterAccount, filterSource]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filterOrders = (stageOrders: PipelineOrder[]) => {
    if (!searchQuery) return stageOrders;
    const q = searchQuery.toLowerCase();
    return stageOrders.filter(
      (o) =>
        o.accountName?.toLowerCase().includes(q) ||
        o.lineItems?.some((li) => li.productName.toLowerCase().includes(q)),
    );
  };

  const getStageOrders = (stage: OrderStage) =>
    filterOrders(orders.filter((o) => o.stage === stage));

  const moveOrder = async (
    orderId: string,
    toStage: OrderStage,
    lossReason: string | null,
    notes: string,
  ) => {
    const res = await fetch(`/api/orders/${orderId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: toStage, lossReason, notes }),
    });
    if (!res.ok) throw new Error("Failed to move order");
    await fetchOrders();
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const toStage = destination.droppableId as OrderStage;
    const order = orders.find((o) => o.id === draggableId);
    if (!order || order.stage === toStage) return;

    if (toStage === "lost" || toStage === "cancelled") {
      setPendingMove({ orderId: draggableId, fromStage: order.stage, toStage });
      setLostDialogOpen(true);
      return;
    }

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === draggableId ? { ...o, stage: toStage } : o)),
    );

    try {
      await moveOrder(draggableId, toStage, null, "");
    } catch {
      toast.error("Failed to move order");
      await fetchOrders();
    }
  };

  const handleLostConfirm = async (
    stage: OrderStage,
    lossReason: string | null,
    notes: string,
  ) => {
    if (!pendingMove) return;
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === pendingMove.orderId ? { ...o, stage } : o,
      ),
    );
    setLostDialogOpen(false);
    setPendingMove(null);
    try {
      await moveOrder(pendingMove.orderId, stage, lossReason, notes);
    } catch {
      toast.error("Failed to move order");
      await fetchOrders();
    }
  };

  const handleLostCancel = () => {
    setLostDialogOpen(false);
    setPendingMove(null);
  };

  // Summary metrics
  const activeOrders = orders.filter(
    (o) => !CLOSED_STAGES.includes(o.stage) && o.stage !== "paid",
  );
  const pipelineValue = activeOrders.reduce(
    (s, o) => s + parseFloat(o.total ?? "0"),
    0,
  );
  const now = new Date();
  const thisMonthOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthValue = thisMonthOrders.reduce(
    (s, o) => s + parseFloat(o.total ?? "0"),
    0,
  );
  const avgOrderValue =
    orders.length > 0
      ? orders.reduce((s, o) => s + parseFloat(o.total ?? "0"), 0) /
        orders.length
      : 0;
  const paidOrders = orders.filter((o) => o.stage === "paid");
  const avgDaysInPipeline =
    paidOrders.length > 0
      ? Math.round(
          paidOrders.reduce((s, o) => {
            const days = Math.floor(
              (Date.now() - new Date(o.createdAt).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return s + days;
          }, 0) / paidOrders.length,
        )
      : 0;

  if (!mounted) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-12" />
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-96 w-64 flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Pipeline</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {orders.filter((o) => !CLOSED_STAGES.includes(o.stage)).length}{" "}
              active orders
            </p>
          </div>
          <Button
            onClick={() => setCreateSheetOpen(true)}
            className="bg-[#D4A843] hover:bg-[#c49a38] text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Order
          </Button>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <SummaryCard
            icon={TrendingUp}
            label="Pipeline Value"
            value={`$${pipelineValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            sub={`${activeOrders.length} open orders`}
          />
          <SummaryCard
            icon={ShoppingCart}
            label="This Month"
            value={`$${thisMonthValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            sub={`${thisMonthOrders.length} orders`}
          />
          <SummaryCard
            icon={BarChart3}
            label="Avg Order Value"
            value={`$${avgOrderValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          />
          <SummaryCard
            icon={Clock}
            label="Avg Days to Paid"
            value={avgDaysInPipeline > 0 ? `${avgDaysInPipeline}d` : "—"}
            sub={paidOrders.length > 0 ? `from ${paidOrders.length} orders` : undefined}
          />
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Search orders…"
            className="w-48 h-8 text-sm"
            value={searchQuery}
            onChange={(e) => {
              if (searchRef.current) clearTimeout(searchRef.current);
              searchRef.current = setTimeout(
                () => setSearchQuery(e.target.value),
                200,
              );
            }}
          />

          {repOptions.length > 1 && (
            <Select value={filterRep} onValueChange={setFilterRep}>
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue placeholder="All Reps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reps</SelectItem>
                {repOptions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {accountOptions.length > 1 && (
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accountOptions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
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

          {(filterRep !== "all" ||
            filterAccount !== "all" ||
            filterSource !== "all" ||
            searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-500"
              onClick={() => {
                setFilterRep("all");
                setFilterAccount("all");
                setFilterSource("all");
                setSearchQuery("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex gap-4 px-6 pb-6 overflow-x-auto flex-1">
          {ACTIVE_STAGES.map((s) => (
            <div key={s} className="flex-shrink-0 w-64">
              <Skeleton className="h-10 mb-2" />
              <Skeleton className="h-32 mb-2" />
              <Skeleton className="h-24" />
            </div>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-auto px-6 pb-6 min-h-0">
            {/* Active columns */}
            <div className="flex gap-3 min-w-max pb-4">
              {ACTIVE_STAGES.map((stage) => {
                const cfg = STAGE_CONFIG[stage];
                const stageOrders = getStageOrders(stage);
                const columnTotal = stageOrders.reduce(
                  (s, o) => s + parseFloat(o.total ?? "0"),
                  0,
                );

                return (
                  <div
                    key={stage}
                    className="flex flex-col w-64 flex-shrink-0"
                  >
                    {/* Column header */}
                    <div
                      className={cn(
                        "rounded-t-lg border px-3 py-2.5 flex-shrink-0",
                        cfg.headerClass,
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-800">
                          {cfg.label}
                        </span>
                        <span className="text-xs bg-white/60 rounded-full px-1.5 py-0.5 font-medium text-gray-700">
                          {stageOrders.length}
                        </span>
                      </div>
                      {columnTotal > 0 && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          $
                          {columnTotal.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      )}
                    </div>

                    {/* Droppable column body */}
                    <Droppable droppableId={stage}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "flex-1 min-h-[120px] rounded-b-lg border-x border-b p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-380px)]",
                            cfg.bgClass,
                            snapshot.isDraggingOver
                              ? "border-[#1B4332]/40 bg-opacity-80"
                              : "border-gray-200",
                          )}
                        >
                          {stageOrders.map((order, index) => (
                            <Draggable
                              key={order.id}
                              draggableId={order.id}
                              index={index}
                            >
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  className={cn(
                                    snap.isDragging
                                      ? "rotate-1 shadow-xl"
                                      : "",
                                  )}
                                >
                                  <OrderCard
                                    order={order}
                                    onClick={() => {
                                      setSelectedOrderId(order.id);
                                      setDetailSheetOpen(true);
                                    }}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {stageOrders.length === 0 && (
                            <p className="text-xs text-center text-gray-400 py-4">
                              Drop orders here
                            </p>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>

            {/* Lost / Cancelled collapsed section */}
            <div className="mt-2">
              <button
                onClick={() => setShowClosedSection((v) => !v)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
              >
                <span
                  className={cn(
                    "transition-transform",
                    showClosedSection ? "rotate-90" : "",
                  )}
                >
                  ▶
                </span>
                Lost / Cancelled (
                {
                  orders.filter((o) => CLOSED_STAGES.includes(o.stage)).length
                }
                )
              </button>

              {showClosedSection && (
                <div className="flex gap-3 min-w-max">
                  {CLOSED_STAGES.map((stage) => {
                    const cfg = STAGE_CONFIG[stage];
                    const stageOrders = getStageOrders(stage);
                    const columnTotal = stageOrders.reduce(
                      (s, o) => s + parseFloat(o.total ?? "0"),
                      0,
                    );

                    return (
                      <div key={stage} className="flex flex-col w-64 flex-shrink-0">
                        <div
                          className={cn(
                            "rounded-t-lg border px-3 py-2.5 flex-shrink-0",
                            cfg.headerClass,
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-700">
                              {cfg.label}
                            </span>
                            <span className="text-xs bg-white/60 rounded-full px-1.5 py-0.5 font-medium text-gray-600">
                              {stageOrders.length}
                            </span>
                          </div>
                          {columnTotal > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              $
                              {columnTotal.toLocaleString("en-US", {
                                maximumFractionDigits: 0,
                              })}
                            </p>
                          )}
                        </div>

                        <Droppable droppableId={stage}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={cn(
                                "min-h-[80px] rounded-b-lg border-x border-b p-2 space-y-2 overflow-y-auto max-h-64",
                                cfg.bgClass,
                                snapshot.isDraggingOver
                                  ? "border-red-400"
                                  : "border-gray-200",
                              )}
                            >
                              {stageOrders.map((order, index) => (
                                <Draggable
                                  key={order.id}
                                  draggableId={order.id}
                                  index={index}
                                >
                                  {(prov) => (
                                    <div
                                      ref={prov.innerRef}
                                      {...prov.draggableProps}
                                      {...prov.dragHandleProps}
                                    >
                                      <OrderCard
                                        order={order}
                                        onClick={() => {
                                          setSelectedOrderId(order.id);
                                          setDetailSheetOpen(true);
                                        }}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              {stageOrders.length === 0 && (
                                <p className="text-xs text-center text-gray-400 py-3">
                                  None
                                </p>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Modals & Sheets */}
      <LostDialog
        open={lostDialogOpen}
        targetStage={pendingMove?.toStage ?? null}
        onConfirm={handleLostConfirm}
        onCancel={handleLostCancel}
      />

      <CreateOrderSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        onCreated={() => {
          setCreateSheetOpen(false);
          fetchOrders();
        }}
      />

      <OrderDetailSheet
        orderId={selectedOrderId}
        open={detailSheetOpen}
        onClose={() => setDetailSheetOpen(false)}
        onUpdated={() => fetchOrders()}
      />
    </div>
  );
}
