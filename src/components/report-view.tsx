"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw, ArrowLeft, Check, X, Minus } from "lucide-react";
import { generateReport, updateReportText, type ReportData } from "@/app/actions/report";
import Link from "next/link";

interface ReportViewProps {
  report: ReportData;
  siteId: string;
  auditId: string;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "ok":
      return <Check className="h-3.5 w-3.5 text-green-600" />;
    case "issue":
      return <X className="h-3.5 w-3.5 text-red-600" />;
    case "na":
      return <Minus className="h-3.5 w-3.5 text-gray-400" />;
    default:
      return <span className="inline-block w-3.5" />;
  }
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const styles: Record<string, string> = {
    ok: "bg-green-50 text-green-700 border-green-200",
    issue: "bg-red-50 text-red-700 border-red-200",
    na: "bg-gray-50 text-gray-500 border-gray-200",
    not_checked: "bg-gray-50 text-gray-400 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${styles[status] || styles.not_checked}`}>
      <StatusIcon status={status} />
      {label}
    </span>
  );
}

export function ReportView({ report, siteId, auditId }: ReportViewProps) {
  const router = useRouter();
  const [regenerating, setRegenerating] = useState(false);
  const [editingSection, setEditingSection] = useState<"summary" | "conclusion" | null>(null);
  const [summaryDraft, setSummaryDraft] = useState(report.executiveSummary);
  const [conclusionDraft, setConclusionDraft] = useState(report.conclusion);
  const [saving, setSaving] = useState(false);

  const totalChecks = report.statsOk + report.statsIssues + report.statsNa + report.statsNotChecked;
  const checkedCount = totalChecks - report.statsNotChecked;
  const progressPct = totalChecks > 0 ? Math.round((checkedCount / totalChecks) * 100) : 0;
  const date = report.createdAt.toISOString().split("T")[0];

  const issueCategories = report.categories
    .map((cat) => ({
      ...cat,
      issues: cat.checks.filter((c) => c.status === "issue"),
    }))
    .filter((cat) => cat.issues.length > 0);

  async function handleSaveText() {
    setSaving(true);
    await updateReportText(report.id, summaryDraft, conclusionDraft);
    setEditingSection(null);
    setSaving(false);
    router.refresh();
  }

  async function handleRegenerate() {
    setRegenerating(true);
    await generateReport(auditId);
    router.refresh();
    setRegenerating(false);
  }

  return (
    <div className="print:p-0">
      {/* Toolbar - hidden in print */}
      <div className="print:hidden sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/sites/${siteId}`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back to audit
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            Version {report.version} - {date}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
            {regenerating ? "Generating..." : "New snapshot"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div className="max-w-[800px] mx-auto px-6 py-10 print:px-0 print:py-0 print:max-w-none">

        {/* === BRANDED HEADER === */}
        <div className="mb-10">
          <div className="flex items-start justify-between mb-6">
            <span className="text-2xl font-bold tracking-tight text-foreground print:text-black">.stormfors</span>
            <span className="text-2xl font-light text-green-600 print:text-green-700">GDPR Compliance Audit</span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-xs border-t border-b border-border print:border-gray-300 py-3">
            <div>
              <div className="text-muted-foreground print:text-gray-500 uppercase tracking-wide font-medium mb-0.5">Company</div>
              <div className="font-medium print:text-black">{report.site.name}</div>
            </div>
            <div>
              <div className="text-muted-foreground print:text-gray-500 uppercase tracking-wide font-medium mb-0.5">Project</div>
              <div className="font-medium print:text-black">GDPR ePR Audit</div>
            </div>
            <div>
              <div className="text-muted-foreground print:text-gray-500 uppercase tracking-wide font-medium mb-0.5">Version</div>
              <div className="font-medium print:text-black">{report.version}.0</div>
            </div>
            <div>
              <div className="text-muted-foreground print:text-gray-500 uppercase tracking-wide font-medium mb-0.5">Date</div>
              <div className="font-medium print:text-black">{date}</div>
            </div>
          </div>
        </div>

        {/* === COMPLIANCE STATUS === */}
        <div className="mb-10">
          <h2 className="text-2xl font-light text-foreground print:text-black mb-3">Compliance Audit Summary</h2>
          <h3 className="text-lg font-semibold text-foreground print:text-black mb-4">GDPR & ePR Performance</h3>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-muted-foreground print:text-gray-500">Current Compliance Status:</span>
            <span className={`text-sm font-semibold ${report.statsIssues === 0 && report.statsNotChecked === 0 ? "text-green-600" : report.statsIssues > 0 ? "text-red-600" : "text-amber-600"}`}>
              {report.statsIssues === 0 && report.statsNotChecked === 0
                ? "FULLY COMPLIANT"
                : report.statsIssues > 0
                  ? `${report.statsIssues} ISSUE${report.statsIssues !== 1 ? "S" : ""} IDENTIFIED`
                  : "AUDIT IN PROGRESS"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-6">
            <div className="text-center py-4 rounded-lg bg-green-50 print:border print:border-green-200">
              <div className="text-3xl font-bold text-green-600">{report.statsOk}</div>
              <div className="text-xs text-green-600/70 uppercase tracking-wide mt-1">Compliant</div>
            </div>
            <div className="text-center py-4 rounded-lg bg-red-50 print:border print:border-red-200">
              <div className="text-3xl font-bold text-red-600">{report.statsIssues}</div>
              <div className="text-xs text-red-600/70 uppercase tracking-wide mt-1">Issues</div>
            </div>
            <div className="text-center py-4 rounded-lg bg-gray-50 print:border print:border-gray-200">
              <div className="text-3xl font-bold text-gray-400">{report.statsNa}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">N/A</div>
            </div>
            <div className="text-center py-4 rounded-lg bg-gray-50 print:border print:border-gray-200">
              <div className="text-3xl font-bold text-gray-300">{report.statsNotChecked}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Not checked</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground print:text-gray-500 mb-1">
              <span>{checkedCount} of {totalChecks} checks completed</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden print:border print:border-gray-300">
              <div
                className={`h-full rounded-full ${report.statsIssues > 0 ? "bg-red-500" : "bg-green-500"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* === 1. EXECUTIVE SUMMARY === */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-foreground print:text-black mb-4">1. Executive Summary</h2>

          {editingSection === "summary" ? (
            <div className="space-y-3 print:hidden">
              <textarea
                className="w-full min-h-[120px] p-3 border border-border rounded-lg text-sm leading-relaxed bg-background text-foreground resize-y"
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveText} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div
              className="text-sm leading-relaxed text-foreground/80 print:text-black cursor-pointer hover:bg-accent/30 print:hover:bg-transparent rounded-lg p-3 -m-3 transition-colors"
              onClick={() => setEditingSection("summary")}
              title="Click to edit"
            >
              {report.executiveSummary.split("\n").map((p, i) => (
                <p key={i} className={i > 0 ? "mt-3" : ""}>{p}</p>
              ))}
              <span className="text-xs text-muted-foreground mt-2 block print:hidden">Click to edit</span>
            </div>
          )}
        </section>

        {/* === 2. KEY FINDINGS === */}
        {issueCategories.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-light text-foreground print:text-black mb-4">2. Technical Audit & Findings</h2>

            {issueCategories.map((cat, catIndex) => (
              <div key={cat.id} className="mb-8">
                <h3 className="text-base font-semibold text-foreground print:text-black mb-3">
                  2.{catIndex + 1} {cat.label}
                </h3>

                {cat.issues.map((check) => (
                  <div key={check.key} className="mb-4 pl-4 border-l-2 border-red-200 print:border-red-300">
                    <p className="text-sm text-foreground/80 print:text-black mb-2">
                      <span className="font-medium">{check.key}:</span> {check.label}
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex gap-2">
                        <span className="text-muted-foreground print:text-gray-600 shrink-0">Findings:</span>
                        <span className="text-foreground/80 print:text-black">
                          {check.notes || "Issue identified during audit."}
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-muted-foreground print:text-gray-600 shrink-0">Action:</span>
                        <span className="text-foreground/80 print:text-black">
                          Remediation required. See appendix for details.
                        </span>
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}

        {/* === 3. CONCLUSION & RECOMMENDATIONS === */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-foreground print:text-black mb-4">
            {issueCategories.length > 0 ? "3" : "2"}. Audit Conclusion & Recommendations
          </h2>

          {editingSection === "conclusion" ? (
            <div className="space-y-3 print:hidden">
              <textarea
                className="w-full min-h-[120px] p-3 border border-border rounded-lg text-sm leading-relaxed bg-background text-foreground resize-y"
                value={conclusionDraft}
                onChange={(e) => setConclusionDraft(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveText} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div
              className="text-sm leading-relaxed text-foreground/80 print:text-black cursor-pointer hover:bg-accent/30 print:hover:bg-transparent rounded-lg p-3 -m-3 transition-colors"
              onClick={() => setEditingSection("conclusion")}
              title="Click to edit"
            >
              {report.conclusion.split("\n").map((p, i) => (
                <p key={i} className={i > 0 ? "mt-3" : ""}>{p}</p>
              ))}
              <span className="text-xs text-muted-foreground mt-2 block print:hidden">Click to edit</span>
            </div>
          )}
        </section>

        {/* === APPENDIX: FULL CHECK RESULTS === */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-foreground print:text-black mb-6">
            Appendix: Detailed Check Results
          </h2>

          {report.categories.map((cat) => {
            const catOk = cat.checks.filter((c) => c.status === "ok").length;
            const catIssues = cat.checks.filter((c) => c.status === "issue").length;

            return (
              <div key={cat.id} className="mb-6 print:break-inside-avoid">
                <div className="flex items-baseline justify-between border-b-2 border-border print:border-gray-300 pb-1.5 mb-0">
                  <h3 className="text-sm font-semibold text-foreground print:text-black">
                    {cat.id}. {cat.label}
                  </h3>
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-600">{catOk} OK</span>
                    {catIssues > 0 && <span className="text-red-600 font-semibold">{catIssues} Issues</span>}
                    <span className="text-muted-foreground print:text-gray-500">{cat.checks.length} total</span>
                  </div>
                </div>

                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border print:border-gray-200">
                      <th className="py-2 pr-2 text-left font-semibold text-muted-foreground print:text-gray-500 uppercase tracking-wide w-10">ID</th>
                      <th className="py-2 px-2 text-left font-semibold text-muted-foreground print:text-gray-500 uppercase tracking-wide">Check</th>
                      <th className="py-2 px-2 text-center font-semibold text-muted-foreground print:text-gray-500 uppercase tracking-wide w-24">Status</th>
                      <th className="py-2 pl-2 text-left font-semibold text-muted-foreground print:text-gray-500 uppercase tracking-wide">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.checks.map((check) => (
                      <tr
                        key={check.key}
                        className={`border-b border-border/50 print:border-gray-100 ${
                          check.status === "issue" ? "bg-red-50/50 print:bg-red-50" :
                          check.status === "ok" ? "bg-green-50/30 print:bg-green-50" : ""
                        }`}
                      >
                        <td className="py-1.5 pr-2 font-medium text-muted-foreground print:text-gray-500">{check.key}</td>
                        <td className="py-1.5 px-2 text-foreground/80 print:text-black">{check.label}</td>
                        <td className="py-1.5 px-2 text-center">
                          <StatusBadge status={check.status} label={check.statusLabel} />
                        </td>
                        <td className="py-1.5 pl-2 text-foreground/60 print:text-gray-600">
                          {check.notes || <span className="text-muted-foreground/40 print:text-gray-300">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>

        {/* === FOOTER === */}
        <footer className="border-t border-border print:border-gray-300 pt-6 mt-10">
          <div className="flex justify-between text-xs text-muted-foreground print:text-gray-500">
            <div>
              {report.auditorName && (
                <div className="mb-3">
                  <div className="font-medium text-foreground print:text-black">{report.auditorName}</div>
                  <div>Stormfors AB</div>
                </div>
              )}
              <div>Stormfors AB</div>
              <div>Kungsgatan 54</div>
              <div>111 35 Stockholm</div>
            </div>
            <div className="text-right">
              <div className="text-foreground print:text-black font-medium">.stormfors</div>
              <div>GDPR Compliance Audit</div>
              <div>{date}</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
