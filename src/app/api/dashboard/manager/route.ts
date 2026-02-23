import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, orgId } = session.user;
    if (role !== "admin" && role !== "sales_manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      kpiOrdersResult,
      visitsWeekResult,
      accountsResult,
      overdueTasksResult,
      agingSamplesResult,
      activityFeedResult,
      teamPerfResult,
      alertTasksResult,
      alertSamplesResult,
      alertStaleOrdersResult,
      alertUnvisitedResult,
    ] = await Promise.all([
      // 1. Orders KPIs: pipeline total + revenue this month + week-over-week new pipeline
      db.execute(sql`
        SELECT
          COALESCE(SUM(CASE WHEN stage NOT IN ('paid','lost','cancelled') THEN total::numeric ELSE 0 END), 0) AS pipeline,
          COALESCE(SUM(CASE WHEN stage = 'paid' AND actual_close_date >= DATE_TRUNC('month', NOW()) THEN total::numeric ELSE 0 END), 0) AS revenue_month,
          COALESCE(SUM(CASE WHEN stage NOT IN ('paid','lost','cancelled') AND created_at >= DATE_TRUNC('week', NOW()) THEN total::numeric ELSE 0 END), 0) AS pipeline_new_this_week,
          COALESCE(SUM(CASE WHEN stage NOT IN ('paid','lost','cancelled') AND created_at >= DATE_TRUNC('week', NOW()) - INTERVAL '7 days' AND created_at < DATE_TRUNC('week', NOW()) THEN total::numeric ELSE 0 END), 0) AS pipeline_new_last_week
        FROM orders
        WHERE org_id = ${orgId}
      `),

      // 2. Visits this week + unique rep count
      db.execute(sql`
        SELECT COUNT(*) AS visits_count, COUNT(DISTINCT rep_id) AS rep_count
        FROM visits
        WHERE org_id = ${orgId} AND check_in_time >= DATE_TRUNC('week', NOW())
      `),

      // 3. Account counts
      db.execute(sql`
        SELECT
          COUNT(*) AS total_accounts,
          COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_accounts
        FROM accounts
        WHERE org_id = ${orgId}
      `),

      // 4. Overdue tasks count
      db.execute(sql`
        SELECT COUNT(*) AS count
        FROM tasks
        WHERE org_id = ${orgId}
          AND status IN ('open','in_progress')
          AND due_date < CURRENT_DATE
      `),

      // 5. Aging samples count
      db.execute(sql`
        SELECT COUNT(*) AS count
        FROM samples
        WHERE org_id = ${orgId}
          AND status = 'awaiting_feedback'
          AND feedback_due_date < CURRENT_DATE
      `),

      // 6. Activity feed — UNION across visits, orders, stage changes, samples, completed tasks
      db.execute(sql`
        SELECT * FROM (
          SELECT
            v.id,
            'visit'::text AS activity_type,
            v.check_in_time AS created_at,
            v.rep_id,
            u.first_name AS rep_first_name,
            u.last_name AS rep_last_name,
            u.avatar_url AS rep_avatar_url,
            a.id AS account_id,
            a.name AS account_name,
            v.outcome::text AS outcome,
            NULL::numeric AS amount,
            NULL::text AS stage,
            NULL::text AS task_title
          FROM visits v
          JOIN users u ON v.rep_id = u.id
          JOIN accounts a ON v.account_id = a.id
          WHERE v.org_id = ${orgId}

          UNION ALL

          SELECT
            o.id,
            'order_created'::text,
            o.created_at,
            o.rep_id,
            u.first_name,
            u.last_name,
            u.avatar_url,
            a.id,
            a.name,
            NULL,
            o.total::numeric,
            o.stage::text,
            NULL
          FROM orders o
          JOIN users u ON o.rep_id = u.id
          JOIN accounts a ON o.account_id = a.id
          WHERE o.org_id = ${orgId}

          UNION ALL

          SELECT
            osh.id,
            'order_stage_change'::text,
            osh.changed_at,
            osh.changed_by,
            u.first_name,
            u.last_name,
            u.avatar_url,
            a.id,
            a.name,
            NULL,
            NULL,
            osh.to_stage,
            NULL
          FROM order_stage_history osh
          JOIN orders o ON osh.order_id = o.id
          JOIN users u ON osh.changed_by = u.id
          JOIN accounts a ON o.account_id = a.id
          WHERE o.org_id = ${orgId}

          UNION ALL

          SELECT
            s.id,
            'sample'::text,
            s.created_at,
            s.rep_id,
            u.first_name,
            u.last_name,
            u.avatar_url,
            a.id,
            a.name,
            NULL,
            NULL,
            NULL,
            NULL
          FROM samples s
          JOIN users u ON s.rep_id = u.id
          JOIN accounts a ON s.account_id = a.id
          WHERE s.org_id = ${orgId}

          UNION ALL

          SELECT
            t.id,
            'task_completed'::text,
            t.completed_at,
            t.assigned_to,
            u.first_name,
            u.last_name,
            u.avatar_url,
            a.id,
            a.name,
            NULL,
            NULL,
            NULL,
            t.title
          FROM tasks t
          JOIN users u ON t.assigned_to = u.id
          LEFT JOIN accounts a ON t.account_id = a.id
          WHERE t.org_id = ${orgId}
            AND t.status = 'completed'
            AND t.completed_at IS NOT NULL
        ) combined
        ORDER BY created_at DESC
        LIMIT 50
      `),

      // 7. Team performance — per rep aggregations in one query
      db.execute(sql`
        SELECT
          u.id AS rep_id,
          u.first_name,
          u.last_name,
          u.avatar_url,
          COALESCE(v_week.cnt, 0) AS visits_week,
          COALESCE(rev_month.total, 0)::numeric AS revenue_month,
          COALESCE(pipe.total, 0)::numeric AS pipeline,
          COALESCE(acc_active.cnt, 0) AS active_accounts,
          COALESCE(acc_total.cnt, 0) AS total_accounts
        FROM users u
        LEFT JOIN (
          SELECT rep_id, COUNT(*) AS cnt
          FROM visits
          WHERE org_id = ${orgId}
            AND check_in_time >= DATE_TRUNC('week', NOW())
          GROUP BY rep_id
        ) v_week ON u.id = v_week.rep_id
        LEFT JOIN (
          SELECT rep_id, SUM(total::numeric) AS total
          FROM orders
          WHERE org_id = ${orgId}
            AND stage = 'paid'
            AND actual_close_date >= DATE_TRUNC('month', NOW())
          GROUP BY rep_id
        ) rev_month ON u.id = rev_month.rep_id
        LEFT JOIN (
          SELECT rep_id, SUM(total::numeric) AS total
          FROM orders
          WHERE org_id = ${orgId}
            AND stage NOT IN ('paid','lost','cancelled')
          GROUP BY rep_id
        ) pipe ON u.id = pipe.rep_id
        LEFT JOIN (
          SELECT assigned_rep_id, COUNT(*) AS cnt
          FROM accounts
          WHERE org_id = ${orgId}
            AND status = 'active'
            AND assigned_rep_id IS NOT NULL
          GROUP BY assigned_rep_id
        ) acc_active ON u.id = acc_active.assigned_rep_id
        LEFT JOIN (
          SELECT assigned_rep_id, COUNT(*) AS cnt
          FROM accounts
          WHERE org_id = ${orgId}
            AND assigned_rep_id IS NOT NULL
          GROUP BY assigned_rep_id
        ) acc_total ON u.id = acc_total.assigned_rep_id
        WHERE u.org_id = ${orgId}
          AND u.role = 'sales_rep'
          AND u.status = 'active'
        ORDER BY revenue_month DESC NULLS LAST
      `),

      // 8. Alert: overdue tasks (top 5)
      db.execute(sql`
        SELECT t.id, t.title, t.due_date, t.priority,
          a.name AS account_name,
          u.first_name, u.last_name
        FROM tasks t
        LEFT JOIN accounts a ON t.account_id = a.id
        JOIN users u ON t.assigned_to = u.id
        WHERE t.org_id = ${orgId}
          AND t.status IN ('open','in_progress')
          AND t.due_date < CURRENT_DATE
        ORDER BY t.due_date ASC
        LIMIT 5
      `),

      // 9. Alert: aging samples awaiting feedback past due (top 5)
      db.execute(sql`
        SELECT s.id, s.feedback_due_date,
          a.name AS account_name,
          u.first_name, u.last_name
        FROM samples s
        JOIN accounts a ON s.account_id = a.id
        JOIN users u ON s.rep_id = u.id
        WHERE s.org_id = ${orgId}
          AND s.status = 'awaiting_feedback'
          AND s.feedback_due_date < CURRENT_DATE
        ORDER BY s.feedback_due_date ASC
        LIMIT 5
      `),

      // 10. Alert: stale orders stuck > 7 days (top 5)
      db.execute(sql`
        SELECT o.id, o.total::numeric AS total, o.stage,
          a.name AS account_name,
          u.first_name, u.last_name, o.updated_at
        FROM orders o
        JOIN accounts a ON o.account_id = a.id
        JOIN users u ON o.rep_id = u.id
        WHERE o.org_id = ${orgId}
          AND o.stage NOT IN ('paid','lost','cancelled')
          AND o.updated_at < NOW() - INTERVAL '7 days'
        ORDER BY o.updated_at ASC
        LIMIT 5
      `),

      // 11. Alert: active accounts with no visit in 30+ days (top 5)
      db.execute(sql`
        SELECT
          a.id,
          a.name,
          a.city,
          a.state,
          u.first_name,
          u.last_name,
          MAX(v.check_in_time) AS last_visit_at
        FROM accounts a
        LEFT JOIN users u ON a.assigned_rep_id = u.id
        LEFT JOIN visits v ON a.id = v.account_id
          AND v.check_in_time > NOW() - INTERVAL '30 days'
        WHERE a.org_id = ${orgId}
          AND a.status = 'active'
        GROUP BY a.id, a.name, a.city, a.state, u.first_name, u.last_name
        HAVING MAX(v.check_in_time) IS NULL
        ORDER BY a.name
        LIMIT 5
      `),
    ]);

    // — KPIs —
    const kpiRow = kpiOrdersResult.rows[0] as Record<string, unknown>;
    const visitsRow = visitsWeekResult.rows[0] as Record<string, unknown>;
    const accountsRow = accountsResult.rows[0] as Record<string, unknown>;
    const overdueRow = overdueTasksResult.rows[0] as Record<string, unknown>;
    const agingRow = agingSamplesResult.rows[0] as Record<string, unknown>;

    const pipeline = parseFloat(String(kpiRow?.pipeline ?? 0));
    const pipelineNewThisWeek = parseFloat(String(kpiRow?.pipeline_new_this_week ?? 0));
    const pipelineNewLastWeek = parseFloat(String(kpiRow?.pipeline_new_last_week ?? 0));
    const pipelineChangePct =
      pipelineNewLastWeek > 0
        ? ((pipelineNewThisWeek - pipelineNewLastWeek) / pipelineNewLastWeek) * 100
        : pipelineNewThisWeek > 0
        ? 100
        : 0;

    // — Alerts (sorted red first, capped at 10) —
    type Alert = {
      id: string;
      type: string;
      severity: "red" | "amber";
      description: string;
      link: string;
    };
    const alerts: Alert[] = [];

    for (const row of alertTasksResult.rows) {
      const r = row as Record<string, unknown>;
      const daysOverdue = Math.floor(
        (Date.now() - new Date(String(r.due_date)).getTime()) / 86_400_000
      );
      alerts.push({
        id: String(r.id),
        type: "overdue_task",
        severity: "red",
        description: `Overdue task: "${r.title}" — ${r.first_name} ${r.last_name}${r.account_name ? ` @ ${r.account_name}` : ""} (${daysOverdue}d overdue)`,
        link: "/dashboard/tasks",
      });
    }

    for (const row of alertSamplesResult.rows) {
      const r = row as Record<string, unknown>;
      const daysOverdue = Math.floor(
        (Date.now() - new Date(String(r.feedback_due_date)).getTime()) / 86_400_000
      );
      alerts.push({
        id: String(r.id),
        type: "aging_sample",
        severity: "red",
        description: `Aging sample at ${r.account_name} — feedback ${daysOverdue}d overdue (${r.first_name} ${r.last_name})`,
        link: "/dashboard/samples",
      });
    }

    for (const row of alertStaleOrdersResult.rows) {
      const r = row as Record<string, unknown>;
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(String(r.updated_at)).getTime()) / 86_400_000
      );
      const stageLabel = String(r.stage).replace(/_/g, " ");
      alerts.push({
        id: String(r.id),
        type: "stale_order",
        severity: "amber",
        description: `Order at ${r.account_name} stuck in "${stageLabel}" for ${daysSinceUpdate}d ($${parseFloat(String(r.total)).toLocaleString("en-US", { maximumFractionDigits: 0 })})`,
        link: "/dashboard/pipeline",
      });
    }

    for (const row of alertUnvisitedResult.rows) {
      const r = row as Record<string, unknown>;
      alerts.push({
        id: String(r.id),
        type: "unvisited_account",
        severity: "amber",
        description: `${r.name} (${r.city}, ${r.state}) — no visit in 30+ days${r.first_name ? ` (${r.first_name} ${r.last_name})` : ""}`,
        link: "/dashboard/accounts",
      });
    }

    alerts.sort((a, b) => {
      if (a.severity === b.severity) return 0;
      return a.severity === "red" ? -1 : 1;
    });

    return NextResponse.json({
      kpis: {
        pipeline,
        pipeline_change_pct: Math.round(pipelineChangePct * 10) / 10,
        revenue_month: parseFloat(String(kpiRow?.revenue_month ?? 0)),
        visits_week: parseInt(String(visitsRow?.visits_count ?? 0)),
        visits_week_reps: parseInt(String(visitsRow?.rep_count ?? 0)),
        active_accounts: parseInt(String(accountsRow?.active_accounts ?? 0)),
        total_accounts: parseInt(String(accountsRow?.total_accounts ?? 0)),
        overdue_tasks: parseInt(String(overdueRow?.count ?? 0)),
        aging_samples: parseInt(String(agingRow?.count ?? 0)),
      },
      activity_feed: activityFeedResult.rows,
      team_performance: teamPerfResult.rows,
      alerts: alerts.slice(0, 10),
    });
  } catch (error) {
    console.error("GET /api/dashboard/manager error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
