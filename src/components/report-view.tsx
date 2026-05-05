"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateReportText, type ReportData } from "@/app/actions/report";

interface ReportViewProps {
  report: ReportData;
  siteId: string;
  showVersion?: boolean;
}

export function ReportView({ report, siteId, showVersion = true }: ReportViewProps) {
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<"summary" | "conclusion" | null>(null);
  const [summaryDraft, setSummaryDraft] = useState(report.executiveSummary);
  const [conclusionDraft, setConclusionDraft] = useState(report.conclusion);
  const [saving, setSaving] = useState(false);

  const totalChecks = report.statsOk + report.statsIssues + report.statsNa + report.statsNotChecked;
  const checkedCount = totalChecks - report.statsNotChecked;
  const date = report.createdAt.toISOString().split("T")[0];

  const issueCategories = report.categories
    .map((cat) => ({
      ...cat,
      issues: cat.checks.filter((c) => c.status === "issue"),
    }))
    .filter((cat) => cat.issues.length > 0);

  const complianceStatus = report.statsIssues === 0 && report.statsNotChecked === 0
    ? "FULLY COMPLIANT"
    : report.statsIssues > 0
      ? `${report.statsIssues} ISSUE${report.statsIssues !== 1 ? "S" : ""} IDENTIFIED`
      : "AUDIT IN PROGRESS";

  async function handleSaveText() {
    setSaving(true);
    await updateReportText(report.id, summaryDraft, conclusionDraft);
    setEditingSection(null);
    setSaving(false);
    router.refresh();
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#1a1a1a", lineHeight: 1.6, fontSize: "14px" }}>

      {/* Toolbar */}
      <div className="print:hidden" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8f8f8", borderBottom: "1px solid #e0e0e0", padding: "10px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "#666" }}>
          {showVersion ? `Version ${report.version}.0 - ` : ""}{date}
        </span>
        <button
          onClick={() => window.print()}
          style={{ padding: "6px 14px", fontSize: "12px", border: "1px solid #ccc", borderRadius: "4px", background: "white", cursor: "pointer" }}
        >
          Print / Save PDF
        </button>
      </div>

      {/* Report document */}
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "50px 40px", background: "white" }}>

        {/* === HEADER === */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <span style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.5px" }}>.stormfors</span>
          <span style={{ fontSize: "22px", fontWeight: 300, color: "#2d8a4e" }}>GDPR Compliance Audit</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: showVersion ? "1fr 1fr 1fr 1fr 1fr" : "1fr 1fr 1fr 1fr", borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc", padding: "10px 0", fontSize: "12px", marginBottom: "40px" }}>
          <div>
            <div style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px", marginBottom: "2px" }}>Company</div>
            <div style={{ fontWeight: 500 }}>{report.site.name}</div>
          </div>
          <div>
            <div style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px", marginBottom: "2px" }}>Project</div>
            <div style={{ fontWeight: 500 }}>GDPR ePR Audit</div>
          </div>
          <div>
            <div style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px", marginBottom: "2px" }}>Type</div>
            <div style={{ fontWeight: 500 }}>{report.auditType === "basic" ? "Basic (34 checks)" : "Full (69 checks)"}</div>
          </div>
          {showVersion && (
            <div>
              <div style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px", marginBottom: "2px" }}>Version</div>
              <div style={{ fontWeight: 500 }}>{report.version}.0</div>
            </div>
          )}
          <div>
            <div style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px", marginBottom: "2px" }}>Date</div>
            <div style={{ fontWeight: 500 }}>{date}</div>
          </div>
        </div>

        {/* === SCOPE === */}
        <p style={{ fontSize: "12px", color: "#666", marginBottom: "40px", borderLeft: "2px solid #ccc", paddingLeft: "12px" }}>
          Scope: Website compliance - consent management, cookie/tracking behavior, privacy information, and third-party integrations. Other processing activities (email marketing, backend data handling, internal systems) are not covered by this audit.
        </p>

        {/* === COMPLIANCE STATUS === */}
        <h2 style={{ fontSize: "26px", fontWeight: 300, marginBottom: "8px" }}>Compliance Audit Summary</h2>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>GDPR & ePR Performance</h3>

        <p style={{ fontSize: "13px", color: "#555", marginBottom: "4px" }}>
          Current Compliance Status: <strong style={{ color: report.statsIssues === 0 && report.statsNotChecked === 0 ? "#2d8a4e" : "#1a1a1a" }}>{complianceStatus}</strong>
        </p>
        <p style={{ fontSize: "13px", color: "#555", marginBottom: "40px" }}>
          {report.statsOk} compliant, {report.statsIssues} issues, {report.statsNa} not applicable, {report.statsNotChecked} not checked ({checkedCount}/{totalChecks} completed)
        </p>

        {/* === 1. EXECUTIVE SUMMARY === */}
        <h2 style={{ fontSize: "22px", fontWeight: 300, marginBottom: "12px" }}>1. Executive Summary</h2>

        <div style={{ marginBottom: "40px" }}>
          {editingSection === "summary" ? (
            <div className="print:hidden">
              <textarea
                style={{ width: "100%", minHeight: "120px", padding: "12px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px", lineHeight: 1.6, fontFamily: "inherit", resize: "vertical" }}
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
              />
            </div>
          ) : (
            <div
              onClick={() => setEditingSection("summary")}
              style={{ cursor: "pointer", padding: "12px", borderRadius: "4px", border: "1px dashed #ccc" }}
              className="print:border-0 print:p-0"
            >
              {report.executiveSummary.split("\n").map((p, i) => (
                <p key={i} style={{ marginBottom: i < report.executiveSummary.split("\n").length - 1 ? "12px" : 0, color: "#333" }}>{p}</p>
              ))}
            </div>
          )}
          <div className="print:hidden" style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={() => editingSection === "summary" ? handleSaveText() : setEditingSection("summary")}
              disabled={saving}
              style={{ padding: "6px 16px", fontSize: "12px", background: "#1a1a1a", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              {saving && editingSection === "summary" ? "Saving..." : editingSection === "summary" ? "Save" : "Edit"}
            </button>
            {editingSection === "summary" && (
              <button onClick={() => { setEditingSection(null); setSummaryDraft(report.executiveSummary); }} style={{ padding: "6px 16px", fontSize: "12px", border: "1px solid #ccc", borderRadius: "4px", background: "white", cursor: "pointer" }}>Cancel</button>
            )}
          </div>
        </div>

        {/* === 2. KEY FINDINGS === */}
        {issueCategories.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 300, marginBottom: "16px" }}>2. Technical Audit & Findings</h2>

            {issueCategories.map((cat, catIndex) => (
              <div key={cat.id} style={{ marginBottom: "28px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>
                  2.{catIndex + 1} {cat.label}
                </h3>

                {cat.issues.map((check) => (
                  <div key={check.key} style={{ marginBottom: "16px", paddingLeft: "16px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "#333", marginBottom: "4px" }}>
                      {check.key}: {check.label}
                    </p>
                    <p style={{ fontSize: "13px", color: "#555", marginBottom: "8px" }}>
                      {check.description}
                    </p>
                    <p style={{ fontSize: "12px", color: "#888" }}>
                      Remediation required. See appendix for auditor notes.
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* === 3. CONCLUSION === */}
        <h2 style={{ fontSize: "22px", fontWeight: 300, marginBottom: "12px" }}>
          {issueCategories.length > 0 ? "3" : "2"}. Audit Conclusion & Recommendations
        </h2>

        <div style={{ marginBottom: "40px" }}>
          {editingSection === "conclusion" ? (
            <div className="print:hidden">
              <textarea
                style={{ width: "100%", minHeight: "120px", padding: "12px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px", lineHeight: 1.6, fontFamily: "inherit", resize: "vertical" }}
                value={conclusionDraft}
                onChange={(e) => setConclusionDraft(e.target.value)}
              />
            </div>
          ) : (
            <div
              onClick={() => setEditingSection("conclusion")}
              style={{ cursor: "pointer", padding: "12px", borderRadius: "4px", border: "1px dashed #ccc" }}
              className="print:border-0 print:p-0"
            >
              {report.conclusion.split("\n").map((p, i) => (
                <p key={i} style={{ marginBottom: i < report.conclusion.split("\n").length - 1 ? "12px" : 0, color: "#333" }}>{p}</p>
              ))}
            </div>
          )}
          <div className="print:hidden" style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={() => editingSection === "conclusion" ? handleSaveText() : setEditingSection("conclusion")}
              disabled={saving}
              style={{ padding: "6px 16px", fontSize: "12px", background: "#1a1a1a", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              {saving && editingSection === "conclusion" ? "Saving..." : editingSection === "conclusion" ? "Save" : "Edit"}
            </button>
            {editingSection === "conclusion" && (
              <button onClick={() => { setEditingSection(null); setConclusionDraft(report.conclusion); }} style={{ padding: "6px 16px", fontSize: "12px", border: "1px solid #ccc", borderRadius: "4px", background: "white", cursor: "pointer" }}>Cancel</button>
            )}
          </div>
        </div>

        {/* === APPENDIX === */}
        <div style={{ marginTop: "50px", paddingTop: "30px", borderTop: "1px solid #ddd" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 300, marginBottom: "24px" }}>Appendix: Detailed Check Results</h2>

          {report.categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: "24px", pageBreakInside: "avoid" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "0" }}>
                {cat.id}. {cat.label}
              </h3>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.3px", borderBottom: "1px solid #eee", width: "40px" }}>ID</th>
                    <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.3px", borderBottom: "1px solid #eee" }}>Check</th>
                    <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "#888", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.3px", borderBottom: "1px solid #eee", width: "70px" }}>Status</th>
                    <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.3px", borderBottom: "1px solid #eee" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.checks.map((check) => (
                    <tr key={check.key}>
                      <td style={{ padding: "5px 8px", borderBottom: "1px solid #f5f5f5", color: "#888", fontWeight: 500 }}>{check.key}</td>
                      <td style={{ padding: "5px 8px", borderBottom: "1px solid #f5f5f5", color: "#333" }}>{check.label}</td>
                      <td style={{ padding: "5px 8px", borderBottom: "1px solid #f5f5f5", textAlign: "center", fontWeight: 500, fontSize: "11px", color: check.status === "ok" ? "#2d8a4e" : check.status === "issue" ? "#c0392b" : "#999" }}>
                        {check.status === "ok" ? "✓ OK" : check.status === "issue" ? "✗ Issue" : check.status === "na" ? "- N/A" : ""}
                      </td>
                      <td style={{ padding: "5px 8px", borderBottom: "1px solid #f5f5f5", color: "#666", fontSize: "11px" }}>
                        {check.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* === FOOTER === */}
        <footer style={{ borderTop: "1px solid #ddd", paddingTop: "24px", marginTop: "40px", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888" }}>
          <div>
            {report.auditorName && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontWeight: 500, color: "#333" }}>{report.auditorName}</div>
                <div>Stormfors AB</div>
              </div>
            )}
            <div>Stormfors AB</div>
            <div>Kungsgatan 54</div>
            <div>111 35 Stockholm</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 500, color: "#333" }}>.stormfors</div>
            <div>GDPR Compliance Audit</div>
            <div>{date}</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
