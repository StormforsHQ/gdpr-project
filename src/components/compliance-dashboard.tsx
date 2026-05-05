"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import type { DashboardData } from "@/app/actions/dashboard";

const chartConfig = {
  ok: { label: "Compliant", color: "rgba(34, 197, 94, 0.55)" },
  issues: { label: "Issues", color: "rgba(221, 51, 51, 0.55)" },
  na: { label: "Not applicable", color: "rgba(224, 120, 0, 0.5)" },
  notChecked: { label: "Not checked", color: "var(--accent)" },
} satisfies ChartConfig;

export function ComplianceDashboard({ data }: { data: DashboardData }) {
  const { current, baseline, history, auditType } = data;
  const checkedCount = current.total - current.notChecked;
  const completionPct = current.total > 0 ? Math.round((checkedCount / current.total) * 100) : 0;
  const compliancePct = checkedCount > 0 ? Math.round((current.ok / checkedCount) * 100) : 0;

  const categoryBarData = current.categories.map((cat) => ({
    name: cat.label,
    ok: cat.ok,
    issues: cat.issues,
    na: cat.na,
    notChecked: cat.notChecked,
  }));

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Completion</p>
            <p className="text-2xl font-semibold">{completionPct}%</p>
            <p className="text-xs text-muted-foreground">{checkedCount} of {current.total} checks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Compliance rate</p>
            <p className="text-2xl font-semibold">{compliancePct}%</p>
            <p className="text-xs text-muted-foreground">{current.ok} compliant of {checkedCount} checked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Issues</p>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{current.issues}</p>
            <p className="text-xs text-muted-foreground">require remediation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Audit type</p>
            <Badge
              variant="secondary"
              className={`mt-1 text-xs ${auditType === "basic" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" : "bg-purple-500/15 text-purple-600 dark:text-purple-400"}`}
            >
              {auditType === "basic" ? "Basic (34 checks)" : "Full (69 checks)"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Trend line chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Trend</CardTitle>
            <CardDescription>
              {history.length > 1
                ? `${history.length} snapshots recorded`
                : history.length === 1
                  ? "Baseline recorded - run more scans to see trends"
                  : "No snapshots yet - complete a scan to start tracking"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <LineChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="ok"
                    name="Compliant"
                    stroke="var(--color-ok)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="issues"
                    name="Issues"
                    stroke="var(--color-issues)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="notChecked"
                    name="Not checked"
                    stroke="var(--color-notChecked)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                Complete a scan to record your first snapshot
              </div>
            )}
            {baseline && history.length > 1 && (
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                <span>Since baseline ({baseline.date.slice(5)}):</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  +{current.ok - baseline.ok} compliant
                </span>
                {current.issues < baseline.issues && (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    -{baseline.issues - current.issues} issues
                  </span>
                )}
                {current.issues > baseline.issues && (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    +{current.issues - baseline.issues} issues
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
          <CardDescription>Compliance status by audit category</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={categoryBarData}
              margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
              barSize={32}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="ok" name="Compliant" stackId="a" fill="var(--color-ok)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="issues" name="Issues" stackId="a" fill="var(--color-issues)" />
              <Bar dataKey="na" name="N/A" stackId="a" fill="var(--color-na)" />
              <Bar dataKey="notChecked" name="Not checked" stackId="a" fill="var(--color-notChecked)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
