"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getHandoffData, type HandoffSite } from "@/app/actions/audits";

function generateHtml(sites: HandoffSite[]): string {
  const date = new Date().toLocaleDateString("sv-SE");
  const rows = sites.map((site) => {
    const checkRows = site.checks.map((check) => {
      const findingsList = check.findings.length > 0
        ? `<ul style="margin:4px 0 0;padding-left:16px;color:#555">${check.findings.map((f) =>
            `<li><span style="color:${f.severity === "error" ? "#dc2626" : "#d97706"}">${f.severity === "error" ? "!" : "?"}</span> ${escapeHtml(f.detail)}</li>`
          ).join("")}</ul>`
        : "";
      return `<tr style="border-bottom:1px solid #e5e5e5;vertical-align:top">
        <td style="padding:6px 8px 6px 0;font-family:monospace;font-weight:600;color:#555;white-space:nowrap">${check.key}</td>
        <td style="padding:6px 8px">
          <strong>${escapeHtml(check.label)}</strong>
          <div style="color:#666;font-size:12px;margin-top:2px">${escapeHtml(check.description)}</div>
          ${check.summary ? `<div style="color:#555;margin-top:4px">${escapeHtml(check.summary)}</div>` : ""}
          ${findingsList}
        </td>
        <td style="padding:6px 0 6px 8px;color:#666;white-space:pre-line">${escapeHtml(check.internalNote || "-")}</td>
      </tr>`;
    }).join("");

    return `<div style="margin-bottom:32px;page-break-inside:avoid">
      <div style="border-bottom:2px solid #111;padding-bottom:4px;margin-bottom:8px">
        <h2 style="margin:0;font-size:15px">${escapeHtml(site.name)}</h2>
        <div style="font-size:11px;color:#888">${escapeHtml(site.url)} - ${escapeHtml(site.coverageType)}</div>
      </div>
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid #ccc;text-align:left">
          <th style="padding:4px 8px 4px 0;width:50px">Check</th>
          <th style="padding:4px 8px">Issue</th>
          <th style="padding:4px 0 4px 8px;width:180px">Note</th>
        </tr></thead>
        <tbody>${checkRows}</tbody>
      </table>
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>GDPR Audit - Issues Handoff ${date}</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;max-width:900px;margin:0 auto;padding:32px;color:#111;font-size:13px}
@media print{body{padding:16px}}</style></head>
<body>
<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:24px">
  <h1 style="font-size:18px;margin:0">GDPR Audit - Issues Handoff</h1>
  <span style="font-size:11px;color:#999">${date} - ${sites.length} site${sites.length !== 1 ? "s" : ""} with issues</span>
</div>
${sites.length === 0 ? "<p style='color:#888'>No in-progress audits with issues found.</p>" : rows}
</body></html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function DownloadHandoff() {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const sites = await getHandoffData();
      const html = generateHtml(sites);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gdpr-handoff-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="text-xs"
    >
      <Download className="h-3.5 w-3.5 mr-1.5" />
      {loading ? "Generating..." : "Download issue handoff"}
    </Button>
  );
}
