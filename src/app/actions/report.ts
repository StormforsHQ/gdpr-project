"use server";

import { prisma } from "@/lib/db";
import { CHECKLIST, STATUS_CONFIG } from "@/lib/checklist";

function deduplicateNotes(notes: string): string {
  if (!notes) return "";
  const parts = notes.split(";").map((s) => s.trim()).filter(Boolean);
  const unique = [...new Set(parts)];
  return unique.join("; ");
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function generateAuditReport(auditId: string) {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: {
      site: true,
      results: true,
    },
  });

  if (!audit) return null;

  const scanRuns = await prisma.scanRun.findMany({
    where: { auditId },
    orderBy: { startedAt: "desc" },
  });

  const resultMap: Record<string, { status: string; notes: string; source: string }> = {};
  for (const r of audit.results) {
    resultMap[r.checkKey] = { status: r.status, notes: r.notes, source: r.source };
  }

  const totalChecks = CHECKLIST.reduce((sum, cat) => sum + cat.checks.length, 0);
  const checked = audit.results.filter((r) => r.status !== "not_checked").length;
  const issues = audit.results.filter((r) => r.status === "issue").length;
  const ok = audit.results.filter((r) => r.status === "ok").length;
  const na = audit.results.filter((r) => r.status === "na").length;
  const notChecked = totalChecks - checked;
  const progressPct = totalChecks > 0 ? Math.round((checked / totalChecks) * 100) : 0;

  const statusIcon = (status: string) => {
    switch (status) {
      case "ok": return "&#10004;";
      case "issue": return "&#10008;";
      case "na": return "&mdash;";
      default: return "";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "ok": return "#16a34a";
      case "issue": return "#dc2626";
      case "na": return "#6b7280";
      default: return "#d1d5db";
    }
  };

  const statusBg = (status: string) => {
    switch (status) {
      case "ok": return "#f0fdf4";
      case "issue": return "#fef2f2";
      default: return "transparent";
    }
  };

  const categorySections = CHECKLIST.map((cat) => {
    const catResults = cat.checks.map((check) => {
      const result = resultMap[check.key];
      return { check, status: result?.status || "not_checked", notes: result?.notes || "", source: result?.source || "" };
    });

    const catIssues = catResults.filter((r) => r.status === "issue").length;
    const catOk = catResults.filter((r) => r.status === "ok").length;
    const catChecked = catResults.filter((r) => r.status !== "not_checked").length;

    const rows = catResults.map((r) => {
      const statusLabel = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG]?.label || "Not checked";
      const cleanNotes = escapeHtml(deduplicateNotes(r.notes));

      return `<tr style="background:${statusBg(r.status)};">
        <td class="cell id-cell">${r.check.key}</td>
        <td class="cell check-cell">${escapeHtml(r.check.label)}</td>
        <td class="cell status-cell" style="color:${statusColor(r.status)};">
          ${statusIcon(r.status)} ${statusLabel}
        </td>
        <td class="cell notes-cell">${cleanNotes || '<span style="color:#d1d5db;">&mdash;</span>'}</td>
      </tr>`;
    }).join("\n");

    const catStatusColor = catIssues > 0 ? "#dc2626" : catChecked === cat.checks.length ? "#16a34a" : "#6b7280";

    return `<div class="category">
      <div class="cat-header">
        <span class="cat-title">${cat.id}. ${cat.label}</span>
        <span class="cat-stats">
          <span style="color:#16a34a;">${catOk} OK</span>
          ${catIssues > 0 ? `<span style="color:#dc2626;font-weight:600;">${catIssues} Issues</span>` : ""}
          <span style="color:#6b7280;">${cat.checks.length} total</span>
        </span>
      </div>
      <table class="results-table">
        <thead>
          <tr>
            <th class="cell id-cell">ID</th>
            <th class="cell check-cell">Check</th>
            <th class="cell status-cell">Status</th>
            <th class="cell notes-cell">Notes</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;
  }).join("\n");

  const scanSection = scanRuns.length > 0
    ? `<div class="category">
        <div class="cat-header"><span class="cat-title">Scan history</span></div>
        <table class="results-table">
          <thead>
            <tr>
              <th class="cell">Type</th>
              <th class="cell">URL</th>
              <th class="cell">Status</th>
              <th class="cell">Findings</th>
              <th class="cell">Date</th>
            </tr>
          </thead>
          <tbody>
            ${scanRuns.map((run) => {
              let findingCount = 0;
              try { findingCount = JSON.parse(run.findings as string).length; } catch {}
              return `<tr>
                <td class="cell">${run.scanType}</td>
                <td class="cell">${run.url}</td>
                <td class="cell">${run.status}</td>
                <td class="cell">${findingCount} checks</td>
                <td class="cell">${run.startedAt.toISOString().split("T")[0]}</td>
              </tr>`;
            }).join("\n")}
          </tbody>
        </table>
      </div>`
    : "";

  const date = new Date().toISOString().split("T")[0];

  const completionNote = checked === 0
    ? `<div class="warning-banner">This audit has not been started yet. No checks have been completed.</div>`
    : notChecked > 0
    ? `<div class="info-banner">${checked} of ${totalChecks} checks completed (${progressPct}%). ${notChecked} checks remaining.</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GDPR Audit Report - ${escapeHtml(audit.site.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 24px;
      color: #1f2937;
      line-height: 1.5;
      font-size: 13px;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .header h1 { font-size: 22px; margin: 0 0 2px 0; }
    .header .subtitle { margin: 0; color: #6b7280; font-size: 13px; }
    .print-btn { padding: 8px 16px; background: #1f2937; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; }
    .print-btn:hover { background: #374151; }
    .info-card { margin-bottom: 20px; padding: 16px 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
    .info-card h2 { font-size: 14px; margin: 0 0 10px 0; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-table td { padding: 3px 0; }
    .info-table .label { color: #6b7280; padding-right: 20px; white-space: nowrap; }
    .info-table .value { font-weight: 500; }
    .summary-grid { display: flex; gap: 16px; }
    .stat-box { text-align: center; padding: 12px 20px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; min-width: 80px; }
    .stat-number { font-size: 26px; font-weight: 700; line-height: 1.1; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px; }
    .progress-bar-container { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 12px 20px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; }
    .progress-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; }
    .progress-text { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .warning-banner { padding: 10px 16px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; color: #92400e; font-size: 12px; margin-bottom: 20px; }
    .info-banner { padding: 10px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; color: #1e40af; font-size: 12px; margin-bottom: 20px; }
    .category { margin-bottom: 20px; }
    .cat-header { display: flex; justify-content: space-between; align-items: baseline; padding: 6px 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 0; }
    .cat-title { font-size: 14px; font-weight: 600; }
    .cat-stats { font-size: 11px; display: flex; gap: 10px; }
    .results-table { width: 100%; border-collapse: collapse; }
    .cell { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; font-size: 12px; }
    .id-cell { width: 36px; font-weight: 600; color: #6b7280; }
    .check-cell { width: 35%; }
    .status-cell { width: 70px; text-align: center; font-weight: 600; font-size: 11px; white-space: nowrap; }
    .notes-cell { color: #4b5563; }
    thead .cell { background: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print {
      body { font-size: 10px; padding: 0; }
      .no-print { display: none !important; }
      @page { margin: 12mm; }
      .info-card { break-inside: avoid; }
      .category { break-inside: avoid; }
      .stat-box { border-color: #d1d5db; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>GDPR Compliance Audit Report</h1>
      <p class="subtitle">${escapeHtml(audit.site.name)} - ${date}</p>
    </div>
    <button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>
  </div>

  <div class="info-card">
    <h2>Site details</h2>
    <table class="info-table">
      <tr><td class="label">Site</td><td class="value">${escapeHtml(audit.site.name)}</td></tr>
      <tr><td class="label">URL</td><td class="value">${escapeHtml(audit.site.url)}</td></tr>
      <tr><td class="label">Platform</td><td class="value">${audit.site.platform}</td></tr>
      ${audit.site.cookiebotId ? `<tr><td class="label">Cookiebot ID</td><td class="value" style="font-family:monospace;">${escapeHtml(audit.site.cookiebotId)}</td></tr>` : ""}
      ${audit.site.gtmId ? `<tr><td class="label">GTM ID</td><td class="value" style="font-family:monospace;">${escapeHtml(audit.site.gtmId)}</td></tr>` : ""}
      ${audit.auditorName ? `<tr><td class="label">Auditor</td><td class="value">${escapeHtml(audit.auditorName)}</td></tr>` : ""}
      <tr><td class="label">Report date</td><td class="value">${date}</td></tr>
    </table>
  </div>

  <div class="info-card">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="stat-box">
        <div class="stat-number" style="color:#16a34a;">${ok}</div>
        <div class="stat-label">OK</div>
      </div>
      <div class="stat-box">
        <div class="stat-number" style="color:#dc2626;">${issues}</div>
        <div class="stat-label">Issues</div>
      </div>
      <div class="stat-box">
        <div class="stat-number" style="color:#6b7280;">${na}</div>
        <div class="stat-label">N/A</div>
      </div>
      <div class="stat-box">
        <div class="stat-number" style="color:#d1d5db;">${notChecked}</div>
        <div class="stat-label">Not checked</div>
      </div>
      <div class="progress-bar-container">
        <div style="font-size:20px;font-weight:700;">${progressPct}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${progressPct}%;background:${issues > 0 ? "#dc2626" : "#16a34a"};"></div>
        </div>
        <div class="progress-text">${checked} of ${totalChecks} checks completed</div>
      </div>
    </div>
  </div>

  ${completionNote}

  ${categorySections}

  ${scanSection}

  <div class="footer">
    <span>Stormfors GDPR Compliance Audit</span>
    <span>${date}</span>
  </div>
</body>
</html>`;

  return html;
}
