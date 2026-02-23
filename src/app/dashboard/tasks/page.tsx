"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  CalendarDays,
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Filter,
  X,
  UserCircle,
  Building2,
  FlaskConical,
  Package,
  MapPin,
  Phone,
  RotateCcw,
  FileText,
  Star,
  Users,
  Loader2,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskType =
  | "follow_up_visit"
  | "reorder_check"
  | "send_menu"
  | "budtender_training"
  | "sample_follow_up"
  | "vendor_day_prep"
  | "manager_assigned"
  | "custom"
  | null;

type TaskPriority = "low" | "medium" | "high" | "urgent";
type TaskStatus = "open" | "in_progress" | "completed" | "cancelled";

interface Task {
  id: string;
  title: string;
  taskType: TaskType;
  description: string | null;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt: string | null;
  accountId: string | null;
  accountName: string | null;
  assignedTo: string;
  assigneeFirstName: string | null;
  assigneeLastName: string | null;
  assigneeAvatarUrl: string | null;
  linkedVisitId: string | null;
  linkedOrderId: string | null;
  linkedSampleId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface OrgUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Account {
  id: string;
  name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTaskTypeIcon(type: TaskType) {
  switch (type) {
    case "follow_up_visit":
      return <MapPin className="h-4 w-4" />;
    case "reorder_check":
      return <RotateCcw className="h-4 w-4" />;
    case "send_menu":
      return <FileText className="h-4 w-4" />;
    case "budtender_training":
      return <Users className="h-4 w-4" />;
    case "sample_follow_up":
      return <FlaskConical className="h-4 w-4" />;
    case "vendor_day_prep":
      return <Star className="h-4 w-4" />;
    case "manager_assigned":
      return <UserCircle className="h-4 w-4" />;
    case "custom":
    default:
      return <PenLine className="h-4 w-4" />;
  }
}

function getTaskTypeLabel(type: TaskType): string {
  switch (type) {
    case "follow_up_visit": return "Follow-up Visit";
    case "reorder_check": return "Reorder Check";
    case "send_menu": return "Send Menu";
    case "budtender_training": return "Budtender Training";
    case "sample_follow_up": return "Sample Follow-up";
    case "vendor_day_prep": return "Vendor Day Prep";
    case "manager_assigned": return "Manager Assigned";
    case "custom": return "Custom";
    default: return "Task";
  }
}

function getPriorityBadge(priority: TaskPriority) {
  const variants: Record<TaskPriority, { label: string; className: string }> = {
    urgent: { label: "Urgent", className: "bg-red-100 text-red-700 border-red-200" },
    high: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200" },
    medium: { label: "Medium", className: "bg-blue-100 text-blue-700 border-blue-200" },
    low: { label: "Low", className: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const v = variants[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        v.className,
      )}
    >
      {v.label}
    </span>
  );
}

function parseDueDate(dateStr: string): Date {
  // API returns dates as ISO timestamps (e.g. "2026-02-16T16:00:00.000Z")
  // because Drizzle's date() column maps to JS Date objects.
  // Slice to "YYYY-MM-DD" then parse as local time to avoid UTC offset issues.
  return new Date(dateStr.slice(0, 10) + "T00:00:00");
}

function formatRelativeDate(dateStr: string): { label: string; isOverdue: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseDueDate(dateStr);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return { label: abs === 1 ? "1 day ago" : `${abs} days ago`, isOverdue: true };
  }
  if (diffDays === 0) return { label: "today", isOverdue: false };
  if (diffDays === 1) return { label: "tomorrow", isOverdue: false };
  if (diffDays < 7) return { label: `in ${diffDays} days`, isOverdue: false };
  return { label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }), isOverdue: false };
}

function categorizeTasks(tasks: Task[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setDate(endOfToday.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const overdue: Task[] = [];
  const dueToday: Task[] = [];
  const thisWeek: Task[] = [];
  const later: Task[] = [];
  const completed: Task[] = [];

  for (const task of tasks) {
    if (task.status === "completed" || task.status === "cancelled") {
      completed.push(task);
      continue;
    }

    const due = parseDueDate(task.dueDate);
    if (due < today) {
      overdue.push(task);
    } else if (due < endOfToday) {
      dueToday.push(task);
    } else if (due < endOfWeek) {
      thisWeek.push(task);
    } else {
      later.push(task);
    }
  }

  overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return { overdue, dueToday, thisWeek, later, completed: completed.slice(0, 10) };
}

// ─── Task Card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  isHighlighted: boolean;
  onComplete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  completing: string | null;
  orgUsers: OrgUser[];
}

function TaskCard({ task, isHighlighted, onComplete, onUpdate, completing, orgUsers }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);
  const [editStatus, setEditStatus] = useState<TaskStatus>(task.status);
  const [editAssignedTo, setEditAssignedTo] = useState(task.assignedTo);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { label: relLabel, isOverdue } = formatRelativeDate(task.dueDate);
  const isCompleted = task.status === "completed";
  const isCompleting = completing === task.id;

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          priority: editPriority,
          status: editStatus,
          assignedTo: editAssignedTo,
        }),
      });
      if (res.ok) {
        const { task: updated } = await res.json();
        onUpdate(task.id, updated);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative rounded-lg border bg-white transition-all",
        isHighlighted && "ring-2 ring-[#D4A843] ring-offset-1",
        isCompleted && "opacity-60",
      )}
    >
      {/* Main row */}
      <div
        className="flex cursor-pointer items-start gap-3 p-3 md:p-4"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-no-expand]")) return;
          setExpanded((v) => !v);
        }}
      >
        {/* Checkbox */}
        <div
          data-no-expand
          className="mt-0.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
              isCompleted
                ? "border-[#10B981] bg-[#10B981] text-white"
                : "border-gray-300 hover:border-[#10B981]",
              isCompleting && "animate-pulse border-[#10B981]",
            )}
            onClick={() => !isCompleted && onComplete(task.id)}
            disabled={isCompleted || isCompleting}
          >
            {isCompleted || isCompleting ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-transparent group-hover:bg-gray-200" />
            )}
          </button>
        </div>

        {/* Type icon */}
        <div className="mt-0.5 flex-shrink-0 text-gray-400">
          {getTaskTypeIcon(task.taskType)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-sm font-semibold text-gray-900",
                isCompleted && "line-through text-gray-400",
              )}
            >
              {task.title}
            </span>
            {getPriorityBadge(task.priority)}
            {task.linkedSampleId && (
              <span title="Linked to sample" className="text-[10px] text-amber-600 bg-amber-50 rounded px-1 py-0.5 border border-amber-200">🧪 Sample</span>
            )}
            {task.linkedOrderId && (
              <span title="Linked to order" className="text-[10px] text-blue-600 bg-blue-50 rounded px-1 py-0.5 border border-blue-200">📦 Order</span>
            )}
            {task.linkedVisitId && (
              <span title="Linked to visit" className="text-[10px] text-green-600 bg-green-50 rounded px-1 py-0.5 border border-green-200">📍 Visit</span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {task.accountId && task.accountName && (
              <Link
                href={`/dashboard/accounts/${task.accountId}`}
                data-no-expand
                className="flex items-center gap-1 font-medium text-[#1B4332] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Building2 className="h-3 w-3" />
                {task.accountName}
              </Link>
            )}
            <span
              className={cn(
                "flex items-center gap-1",
                isOverdue ? "font-medium text-red-600" : "text-gray-500",
              )}
            >
              <Clock className="h-3 w-3" />
              {relLabel}
            </span>
            {task.assigneeFirstName && (
              <span className="flex items-center gap-1">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1B4332] text-[8px] font-bold text-white">
                  {task.assigneeFirstName[0]}{task.assigneeLastName?.[0] ?? ""}
                </div>
                {task.assigneeFirstName} {task.assigneeLastName}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t bg-gray-50 p-3 md:p-4">
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-700">Title</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Description</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 min-h-[60px] text-sm"
                  placeholder="Add details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Priority</Label>
                  <Select value={editPriority} onValueChange={(v) => setEditPriority(v as TaskPriority)}>
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Status</Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as TaskStatus)}>
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Assigned To</Label>
                  <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orgUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {task.description && (
                <p className="text-sm text-gray-700">{task.description}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>Type: <span className="font-medium text-gray-700">{getTaskTypeLabel(task.taskType)}</span></span>
                <span>Due: <span className="font-medium text-gray-700">{parseDueDate(task.dueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span></span>
                <span>Status: <span className="font-medium text-gray-700 capitalize">{task.status.replace("_", " ")}</span></span>
                {task.completedAt && (
                  <span>Completed: <span className="font-medium text-gray-700">{new Date(task.completedAt).toLocaleDateString()}</span></span>
                )}
              </div>
              {!isCompleted && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditing(true)}>
                    Edit Task
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  bgClass: string;
  defaultCollapsed?: boolean;
  highlightId: string | null;
  onComplete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  completing: string | null;
  orgUsers: OrgUser[];
}

function TaskSection({
  title,
  icon,
  tasks,
  bgClass,
  defaultCollapsed = false,
  highlightId,
  onComplete,
  onUpdate,
  completing,
  orgUsers,
}: SectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (tasks.length === 0) return null;

  return (
    <div className={cn("rounded-xl border", bgClass)}>
      <button
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        onClick={() => setCollapsed((v) => !v)}
      >
        {icon}
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <span className="ml-1 rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium text-gray-600">
          {tasks.length}
        </span>
        <div className="ml-auto text-gray-400">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {!collapsed && (
        <div className="space-y-2 px-4 pb-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isHighlighted={task.id === highlightId}
              onComplete={onComplete}
              onUpdate={onUpdate}
              completing={completing}
              orgUsers={orgUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Task Modal ──────────────────────────────────────────────────────────

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
  orgUsers: OrgUser[];
  accounts: Account[];
  currentUserId: string;
}

function AddTaskModal({ open, onClose, onCreated, orgUsers, accounts, currentUserId }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState(currentUserId);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [linkedVisitId, setLinkedVisitId] = useState("");
  const [linkedOrderId, setLinkedOrderId] = useState("");
  const [linkedSampleId, setLinkedSampleId] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredAccounts = accounts.filter((a) =>
    a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("[CreateTask] handleSubmit fired", { title, dueDate, assignedTo, priority, taskType, accountId });

    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!dueDate) errs.dueDate = "Due date is required";
    if (!assignedTo) errs.assignedTo = "Must assign to a user";

    if (Object.keys(errs).length > 0) {
      console.log("[CreateTask] Validation failed:", errs);
      setErrors(errs);
      return;
    }

    const payload = {
      title: title.trim(),
      taskType: taskType || null,
      description: description.trim() || null,
      accountId: accountId || null,
      assignedTo,
      dueDate,
      priority,
      linkedVisitId: linkedVisitId || null,
      linkedOrderId: linkedOrderId || null,
      linkedSampleId: linkedSampleId || null,
    };
    console.log("[CreateTask] Sending payload:", payload);

    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[CreateTask] API response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("[CreateTask] Task created:", data.task);
        onCreated(data.task);
        resetForm();
        onClose();
      } else {
        const data = await res.json();
        console.error("[CreateTask] API error:", data);
        setErrors({ general: data.error || "Failed to create task" });
      }
    } catch (err) {
      console.error("[CreateTask] Fetch error:", err);
      setErrors({ general: "Network error — please try again" });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTitle("");
    setTaskType("");
    setDescription("");
    setAccountSearch("");
    setAccountId("");
    setAssignedTo(currentUserId);
    setDueDate("");
    setPriority("medium");
    setLinkedVisitId("");
    setLinkedOrderId("");
    setLinkedSampleId("");
    setErrors({});
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); resetForm(); } }}>
      <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <p className="rounded bg-red-50 p-2 text-xs text-red-600">{errors.general}</p>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="task-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
              placeholder="Task title..."
              className="mt-1"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Type */}
          <div>
            <Label>Task Type</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="follow_up_visit">Follow-up Visit</SelectItem>
                <SelectItem value="reorder_check">Reorder Check</SelectItem>
                <SelectItem value="send_menu">Send Menu</SelectItem>
                <SelectItem value="budtender_training">Budtender Training</SelectItem>
                <SelectItem value="sample_follow_up">Sample Follow-up</SelectItem>
                <SelectItem value="vendor_day_prep">Vendor Day Prep</SelectItem>
                <SelectItem value="manager_assigned">Manager Assigned</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* Account */}
          <div>
            <Label>Account</Label>
            <div className="mt-1 space-y-1">
              <Input
                placeholder="Search accounts..."
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
              />
              {accountSearch && filteredAccounts.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-md border bg-white shadow-sm">
                  {filteredAccounts.slice(0, 8).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-gray-50",
                        accountId === a.id && "bg-green-50 font-medium",
                      )}
                      onClick={() => {
                        setAccountId(a.id);
                        setAccountSearch(a.name);
                      }}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              )}
              {accountId && (
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-red-500"
                  onClick={() => { setAccountId(""); setAccountSearch(""); }}
                >
                  × Clear account
                </button>
              )}
            </div>
          </div>

          {/* Row: Assigned to + Due date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>
                Assigned To <span className="text-red-500">*</span>
              </Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orgUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignedTo && <p className="mt-1 text-xs text-red-500">{errors.assignedTo}</p>}
            </div>

            <div>
              <Label>
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); setErrors((p) => ({ ...p, dueDate: "" })); }}
                className="mt-1"
              />
              {errors.dueDate && <p className="mt-1 text-xs text-red-500">{errors.dueDate}</p>}
            </div>
          </div>

          {/* Priority */}
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Link to */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500 uppercase tracking-wide">
              Link to (optional)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Visit ID</Label>
                <Input
                  value={linkedVisitId}
                  onChange={(e) => setLinkedVisitId(e.target.value)}
                  placeholder="UUID..."
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Order ID</Label>
                <Input
                  value={linkedOrderId}
                  onChange={(e) => setLinkedOrderId(e.target.value)}
                  placeholder="UUID..."
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Sample ID</Label>
                <Input
                  value={linkedSampleId}
                  onChange={(e) => setLinkedSampleId(e.target.value)}
                  placeholder="UUID..."
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onClose(); resetForm(); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1B4332] hover:bg-[#1B4332]/90"
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssigned, setFilterAssigned] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterPriority) params.set("priority", filterPriority);
    if (filterStatus) params.set("status", filterStatus);
    if (filterAssigned) params.set("assigned_to", filterAssigned);
    params.set("include_completed", "true");

    const res = await fetch(`/api/tasks?${params}`);
    if (res.ok) {
      const data = await res.json();
      setAllTasks(data.tasks || []);
    }
  }, [filterType, filterPriority, filterStatus, filterAssigned]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([
        loadTasks(),
        fetch("/api/team/users")
          .then((r) => r.json())
          .then((d) => setOrgUsers(d.users || []))
          .catch(() => {}),
        fetch("/api/accounts?limit=200")
          .then((r) => r.json())
          .then((d) => setAccounts((d.accounts || []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name }))))
          .catch(() => {}),
      ]);
      setLoading(false);
    }
    init();
  }, [loadTasks]);

  async function handleComplete(id: string) {
    setCompleting(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (res.ok) {
        await new Promise((r) => setTimeout(r, 400));
        setAllTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, status: "completed", completedAt: new Date().toISOString() }
              : t,
          ),
        );
      }
    } finally {
      setCompleting(null);
    }
  }

  function handleUpdate(id: string, updates: Partial<Task>) {
    setAllTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  }

  function handleCreated(task: Task) {
    setAllTasks((prev) => [task, ...prev]);
  }

  const activeFilters = [filterType, filterPriority, filterStatus, filterAssigned].filter(Boolean).length;

  const filteredTasks = allTasks;
  const { overdue, dueToday, thisWeek, later, completed } = categorizeTasks(filteredTasks);

  const isEmpty = overdue.length === 0 && dueToday.length === 0 && thisWeek.length === 0 && later.length === 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
            <p className="text-sm text-gray-500">
              {overdue.length > 0 && (
                <span className="font-medium text-red-600">{overdue.length} overdue · </span>
              )}
              {dueToday.length} due today · {thisWeek.length} this week
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(activeFilters > 0 && "border-[#1B4332] text-[#1B4332]")}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Filters
              {activeFilters > 0 && (
                <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1B4332] text-[10px] font-bold text-white">
                  {activeFilters}
                </span>
              )}
            </Button>
            <Button
              size="sm"
              className="bg-[#D4A843] text-white hover:bg-[#D4A843]/90"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        {filtersOpen && (
          <div className="mb-4 rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px]">
                <Label className="text-xs">Task Type</Label>
                <Select value={filterType || "_all"} onValueChange={(v) => setFilterType(v === "_all" ? "" : v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Types</SelectItem>
                    <SelectItem value="follow_up_visit">Follow-up Visit</SelectItem>
                    <SelectItem value="reorder_check">Reorder Check</SelectItem>
                    <SelectItem value="send_menu">Send Menu</SelectItem>
                    <SelectItem value="budtender_training">Budtender Training</SelectItem>
                    <SelectItem value="sample_follow_up">Sample Follow-up</SelectItem>
                    <SelectItem value="vendor_day_prep">Vendor Day Prep</SelectItem>
                    <SelectItem value="manager_assigned">Manager Assigned</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[120px]">
                <Label className="text-xs">Priority</Label>
                <Select value={filterPriority || "_all"} onValueChange={(v) => setFilterPriority(v === "_all" ? "" : v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[120px]">
                <Label className="text-xs">Status</Label>
                <Select value={filterStatus || "_all"} onValueChange={(v) => setFilterStatus(v === "_all" ? "" : v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[160px]">
                <Label className="text-xs">Assigned Rep</Label>
                <Select value={filterAssigned || "_all"} onValueChange={(v) => setFilterAssigned(v === "_all" ? "" : v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Anyone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Anyone</SelectItem>
                    {orgUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeFilters > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500"
                  onClick={() => {
                    setFilterType("");
                    setFilterPriority("");
                    setFilterStatus("");
                    setFilterAssigned("");
                  }}
                >
                  <X className="mr-1 h-3 w-3" /> Clear all
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Task sections */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B4332]" />
          </div>
        ) : (
          <div className="space-y-4">
            <TaskSection
              title="Overdue"
              icon={<AlertCircle className="h-4 w-4 text-red-500" />}
              tasks={overdue}
              bgClass="border-red-200 bg-red-50"
              highlightId={highlightId}
              onComplete={handleComplete}
              onUpdate={handleUpdate}
              completing={completing}
              orgUsers={orgUsers}
            />
            <TaskSection
              title="Due Today"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              tasks={dueToday}
              bgClass="border-amber-200 bg-amber-50"
              highlightId={highlightId}
              onComplete={handleComplete}
              onUpdate={handleUpdate}
              completing={completing}
              orgUsers={orgUsers}
            />
            <TaskSection
              title="This Week"
              icon={<CalendarDays className="h-4 w-4 text-blue-500" />}
              tasks={thisWeek}
              bgClass="border-blue-200 bg-blue-50"
              highlightId={highlightId}
              onComplete={handleComplete}
              onUpdate={handleUpdate}
              completing={completing}
              orgUsers={orgUsers}
            />
            <TaskSection
              title="Later"
              icon={<Calendar className="h-4 w-4 text-gray-400" />}
              tasks={later}
              bgClass="border-gray-200 bg-gray-50"
              highlightId={highlightId}
              onComplete={handleComplete}
              onUpdate={handleUpdate}
              completing={completing}
              orgUsers={orgUsers}
            />
            <TaskSection
              title="Recently Completed"
              icon={<CheckCircle2 className="h-4 w-4 text-[#10B981]" />}
              tasks={completed}
              bgClass="border-gray-200 bg-gray-50"
              defaultCollapsed
              highlightId={highlightId}
              onComplete={handleComplete}
              onUpdate={handleUpdate}
              completing={completing}
              orgUsers={orgUsers}
            />

            {isEmpty && !loading && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-[#10B981]" />
                <p className="font-semibold text-gray-700">All caught up!</p>
                <p className="mt-1 text-sm text-gray-500">No open tasks. Add one to get started.</p>
                <Button
                  className="mt-4 bg-[#D4A843] text-white hover:bg-[#D4A843]/90"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <AddTaskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleCreated}
        orgUsers={orgUsers}
        accounts={accounts}
        currentUserId={session?.user?.id ?? ""}
      />
    </div>
  );
}
