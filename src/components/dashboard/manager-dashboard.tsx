"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  MapPin,
  Users,
  CheckSquare,
  FlaskConical,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ───────────────────────────────────────────────────────────────────

interface KPIData {
  pipeline: number;
  pipeline_change_pct: number;
  revenue_month: number;
  visits_week: number;
  visits_week_reps: number;
  active_accounts: number;
  total_accounts: number;
  overdue_tasks: number;
  aging_samples: number;
}

interface ActivityItem {
  id: string;
  activity_type: "visit" | "order_created" | "order_stage_change" | "sample" | "task_completed";
  created_at: string;
  rep_id: string;
  rep_first_name: string;
  rep_last_name: string;
  rep_avatar_url: string | null;
  account_id: string | null;
  account_name: string | null;
  outcome: string | null;
  amount: string | null;
  stage: string | null;
  task_title: string | null;
}

interface TeamMember {
  rep_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  visits_week: number | string;
  revenue_month: number | string;
  pipeline: number | string;
  active_accounts: number | string;
  total_accounts: number | string;
}

interface Alert {
  id: string;
  type: string;
  severity: "red" | "amber";
  description: string;
  link: string;
}

interface DashboardData {
  kpis: KPIData;
  activity_feed: ActivityItem[];
  team_performance: TeamMember[];
  alerts: Alert[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay >= 7)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "just now";
}

function humanize(str: string): string {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getInitials(first: string, last: string): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

function getActivityDescription(item: ActivityItem): {
  action: string;
  detail?: string;
} {
  switch (item.activity_type) {
    case "visit":
      return {
        action: "logged a visit",
        detail: item.outcome ? `— ${humanize(item.outcome)}` : undefined,
      };
    case "order_created":
      return {
        action: `created ${item.amount ? formatCurrency(item.amount) : "an"} order`,
      };
    case "order_stage_change":
      return {
        action: `moved order to ${item.stage ? humanize(item.stage) : "new stage"}`,
      };
    case "sample":
      return { action: "dropped samples" };
    case "task_completed":
      return { action: `completed task: ${item.task_title ?? ""}` };
    default:
      return { action: "performed an action" };
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface ManagerDashboardProps {
  firstName: string;
  role: "admin" | "sales_manager";
}

export function ManagerDashboard({ firstName, role }: ManagerDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReps, setSelectedReps] = useState<string[]>([]);
  const [feedLimit, setFeedLimit] = useState(15);
  const [teamSort, setTeamSort] = useState<{
    column: keyof TeamMember;
    direction: "asc" | "desc";
  }>({ column: "revenue_month", direction: "desc" });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/manager");
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const uniqueReps = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const reps: { id: string; firstName: string; lastName: string }[] = [];
    for (const item of data.activity_feed) {
      if (!seen.has(item.rep_id)) {
        seen.add(item.rep_id);
        reps.push({
          id: item.rep_id,
          firstName: item.rep_first_name,
          lastName: item.rep_last_name,
        });
      }
    }
    return reps;
  }, [data]);

  const filteredActivity = useMemo(() => {
    if (!data) return [];
    const feed =
      selectedReps.length > 0
        ? data.activity_feed.filter((i) => selectedReps.includes(i.rep_id))
        : data.activity_feed;
    return feed.slice(0, feedLimit);
  }, [data, selectedReps, feedLimit]);

  const totalFiltered = useMemo(() => {
    if (!data) return 0;
    return selectedReps.length > 0
      ? data.activity_feed.filter((i) => selectedReps.includes(i.rep_id)).length
      : data.activity_feed.length;
  }, [data, selectedReps]);

  const sortedTeam = useMemo(() => {
    if (!data) return [];
    return [...data.team_performance].sort((a, b) => {
      const aVal = parseFloat(String(a[teamSort.column] ?? 0));
      const bVal = parseFloat(String(b[teamSort.column] ?? 0));
      return teamSort.direction === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [data, teamSort]);

  function handleSort(column: keyof TeamMember) {
    setTeamSort((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === "desc" ? "asc" : "desc",
    }));
  }

  function toggleExpand(id: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleRep(repId: string) {
    setSelectedReps((prev) =>
      prev.includes(repId) ? prev.filter((id) => id !== repId) : [...prev, repId]
    );
    setFeedLimit(15);
  }

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { kpis } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome back, {firstName}!
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-[#1B4332]/10 text-[#1B4332]"
            >
              {role === "admin" ? "Admin" : "Sales Manager"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Team overview · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchDashboard}
          className="text-muted-foreground hover:text-gray-900"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KPICard
          title="Total Pipeline"
          value={formatCurrency(kpis.pipeline)}
          change={kpis.pipeline_change_pct}
          changeLabel="vs last week"
          href="/dashboard/pipeline"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPICard
          title="Revenue This Month"
          value={formatCurrency(kpis.revenue_month)}
          href="/dashboard/pipeline?stage=paid"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="Visits This Week"
          value={String(kpis.visits_week)}
          subtext={`by ${kpis.visits_week_reps} rep${kpis.visits_week_reps !== 1 ? "s" : ""}`}
          href="/dashboard/visits"
          icon={<MapPin className="h-4 w-4" />}
        />
        <KPICard
          title="Active Accounts"
          value={String(kpis.active_accounts)}
          subtext={`of ${kpis.total_accounts} total`}
          href="/dashboard/accounts?status=active"
          icon={<Users className="h-4 w-4" />}
        />
        <KPICard
          title="Overdue Tasks"
          value={String(kpis.overdue_tasks)}
          href="/dashboard/tasks"
          icon={<CheckSquare className="h-4 w-4" />}
          alert={kpis.overdue_tasks > 0}
        />
        <KPICard
          title="Aging Samples"
          value={String(kpis.aging_samples)}
          href="/dashboard/samples"
          icon={<FlaskConical className="h-4 w-4" />}
          alert={kpis.aging_samples > 0}
        />
      </div>

      {/* Main Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Activity Feed — left 60% */}
        <div className="min-w-0 lg:w-[60%]">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Activity Feed</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {data.activity_feed.length} events
                </span>
              </div>

              {/* Rep filter toggles */}
              {uniqueReps.length > 1 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {uniqueReps.map((rep) => (
                    <button
                      key={rep.id}
                      onClick={() => toggleRep(rep.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        selectedReps.includes(rep.id)
                          ? "border-[#1B4332] bg-[#1B4332] text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#1B4332]/40 hover:text-[#1B4332]"
                      }`}
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold">
                        {getInitials(rep.firstName, rep.lastName)}
                      </span>
                      {rep.firstName}
                    </button>
                  ))}
                  {selectedReps.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedReps([]);
                        setFeedLimit(15);
                      }}
                      className="px-2 text-xs text-muted-foreground hover:text-gray-900"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {filteredActivity.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  No activity to display
                </div>
              ) : (
                <div className="divide-y">
                  {filteredActivity.map((item) => {
                    const key = `${item.activity_type}-${item.id}`;
                    const expanded = expandedItems.has(key);
                    const { action, detail } = getActivityDescription(item);

                    return (
                      <div key={key} className="px-4 py-3">
                        <div
                          className="flex cursor-pointer items-start gap-3"
                          onClick={() => toggleExpand(key)}
                        >
                          {/* Avatar */}
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B4332]/10 text-[10px] font-semibold text-[#1B4332]">
                            {getInitials(item.rep_first_name, item.rep_last_name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug">
                              <span className="font-semibold">
                                {item.rep_first_name} {item.rep_last_name}
                              </span>{" "}
                              <span className="text-gray-600">{action}</span>
                              {detail && (
                                <span className="text-gray-500"> {detail}</span>
                              )}
                              {item.account_name && (
                                <>
                                  {" "}
                                  <span className="text-gray-400">at</span>{" "}
                                  <span className="font-medium text-[#1B4332]">
                                    {item.account_name}
                                  </span>
                                </>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatRelativeTime(item.created_at)}
                            </p>
                          </div>

                          <div className="shrink-0 text-gray-300">
                            {expanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {expanded && (
                          <div className="ml-10 mt-2 rounded-md border border-gray-100 bg-gray-50 p-3">
                            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                              <dt className="text-muted-foreground">Type</dt>
                              <dd className="capitalize">
                                {humanize(item.activity_type)}
                              </dd>
                              {item.account_name && (
                                <>
                                  <dt className="text-muted-foreground">Account</dt>
                                  <dd>{item.account_name}</dd>
                                </>
                              )}
                              {item.outcome && (
                                <>
                                  <dt className="text-muted-foreground">Outcome</dt>
                                  <dd>{humanize(item.outcome)}</dd>
                                </>
                              )}
                              {item.amount && (
                                <>
                                  <dt className="text-muted-foreground">Amount</dt>
                                  <dd className="font-medium">
                                    {formatCurrency(item.amount)}
                                  </dd>
                                </>
                              )}
                              {item.stage && (
                                <>
                                  <dt className="text-muted-foreground">Stage</dt>
                                  <dd>{humanize(item.stage)}</dd>
                                </>
                              )}
                              {item.task_title && (
                                <>
                                  <dt className="text-muted-foreground">Task</dt>
                                  <dd>{item.task_title}</dd>
                                </>
                              )}
                              <dt className="text-muted-foreground">Time</dt>
                              <dd>
                                {new Date(item.created_at).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </dd>
                            </dl>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load More */}
              {totalFiltered > feedLimit && (
                <div className="border-t p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-gray-900"
                    onClick={() => setFeedLimit((prev) => prev + 15)}
                  >
                    Load more ({totalFiltered - feedLimit} remaining)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar — 40% */}
        <div className="flex flex-col gap-6 lg:w-[40%]">
          {/* Team Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Team Performance</CardTitle>
              <p className="text-xs text-muted-foreground">
                Visits this week · Revenue this month · Active pipeline
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-[#F8FAFC]">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Rep
                      </th>
                      {(
                        [
                          { key: "visits_week", label: "Visits" },
                          { key: "revenue_month", label: "Revenue" },
                          { key: "pipeline", label: "Pipeline" },
                          { key: "active_accounts", label: "Accts" },
                        ] as { key: keyof TeamMember; label: string }[]
                      ).map((col) => (
                        <th
                          key={col.key}
                          className="cursor-pointer px-2 py-2 text-right font-medium text-muted-foreground hover:text-gray-900 select-none"
                          onClick={() => handleSort(col.key)}
                        >
                          <span className="inline-flex items-center justify-end gap-0.5">
                            {col.label}
                            {teamSort.column === col.key &&
                              (teamSort.direction === "desc" ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronUp className="h-3 w-3" />
                              ))}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sortedTeam.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No reps found
                        </td>
                      </tr>
                    ) : (
                      sortedTeam.map((rep) => (
                        <tr
                          key={rep.rep_id}
                          className="transition-colors hover:bg-gray-50"
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B4332]/10 text-[9px] font-semibold text-[#1B4332]">
                                {getInitials(rep.first_name, rep.last_name)}
                              </div>
                              <span className="whitespace-nowrap font-medium text-gray-900">
                                {rep.first_name} {rep.last_name[0]}.
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-gray-700">
                            {Number(rep.visits_week)}
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums font-medium text-gray-900">
                            {formatCurrency(rep.revenue_month)}
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-gray-700">
                            {formatCurrency(rep.pipeline)}
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-gray-700">
                            {Number(rep.active_accounts)}/{Number(rep.total_accounts)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base">Alerts</CardTitle>
                {data.alerts.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-auto h-5 rounded-full px-1.5 text-[11px]"
                  >
                    {data.alerts.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.alerts.length === 0 ? (
                <div className="flex h-24 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span className="text-lg">✓</span> All clear — no alerts
                </div>
              ) : (
                <div className="divide-y">
                  {data.alerts.map((alert) => (
                    <div
                      key={`${alert.type}-${alert.id}`}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <div
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          alert.severity === "red"
                            ? "bg-red-500"
                            : "bg-amber-400"
                        }`}
                      />
                      <p className="flex-1 text-xs leading-relaxed text-gray-700">
                        {alert.description}
                      </p>
                      <Link
                        href={alert.link}
                        className="shrink-0 text-xs font-medium text-[#1B4332] hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  subtext?: string;
  href: string;
  icon: React.ReactNode;
  alert?: boolean;
}

function KPICard({
  title,
  value,
  change,
  changeLabel,
  subtext,
  href,
  icon,
  alert = false,
}: KPICardProps) {
  const router = useRouter();

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        alert
          ? "border-red-200 bg-red-50 hover:border-red-300"
          : "hover:border-[#1B4332]/20"
      }`}
      onClick={() => router.push(href)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              alert
                ? "bg-red-100 text-red-600"
                : "bg-[#1B4332]/10 text-[#1B4332]"
            }`}
          >
            {icon}
          </div>
          {change !== undefined && change !== 0 && (
            <span
              className={`flex items-center gap-0.5 text-xs font-semibold ${
                change > 0 ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {change > 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="mt-3">
          <p
            className={`text-2xl font-bold tabular-nums ${
              alert ? "text-red-700" : "text-gray-900"
            }`}
          >
            {value}
          </p>
          <p
            className={`mt-0.5 text-xs ${
              alert ? "font-medium text-red-500" : "text-muted-foreground"
            }`}
          >
            {title}
          </p>
          {subtext && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>
          )}
          {changeLabel && change !== undefined && (
            <p className="mt-0.5 text-xs text-muted-foreground">{changeLabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="mt-3 h-7 w-14" />
              <Skeleton className="mt-1.5 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-[60%]">
          <Card>
            <CardContent className="space-y-4 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6 lg:w-[40%]">
          <Card>
            <CardContent className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
