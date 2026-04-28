"use server";

import { prisma } from "@/lib/db";
import { CHECKLIST, STATUS_CONFIG } from "@/lib/checklist";

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

  const statusIcon = (status: string) => {
    switch (status) {
      case "ok": return "&#10004;";
      case "issue": return "&#10008;";
      case "na": return "&#8212;";
      default: return "&#9744;";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "ok": return "#16a34a";
      case "issue": return "#dc2626";
      case "na": return "#9ca3af";
      default: return "#9ca3af";
    }
  };

  const categorySections = CHECKLIST.map((cat) => {
    const rows = cat.checks.map((check) => {
      const result = resultMap[check.key];
      const status = result?.status || "not_checked";
      const notes = result?.notes || "";
      const source = result?.source || "";
      const statusLabel = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || "Not checked";

      return `<tr>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:500;white-space:nowrap;">${check.key}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;">${check.label}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;color:${statusColor(status)};font-weight:600;">
          <span style="margin-right:4px;">${statusIcon(status)}</span>${statusLabel}
        </td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px;color:#6b7280;">${source}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px;">${notes}</td>
      </tr>`;
    }).join("\n");

    const catIssues = cat.checks.filter((c) => resultMap[c.key]?.status === "issue").length;
    const catOk = cat.checks.filter((c) => resultMap[c.key]?.status === "ok").length;

    return `<div style="margin-bottom:24px;">
      <h3 style="font-size:16px;margin:0 0 8px 0;padding-bottom:4px;border-bottom:2px solid #e5e7eb;">
        ${cat.id}. ${cat.label}
        <span style="font-size:12px;font-weight:normal;color:#6b7280;margin-left:8px;">
          ${catOk} OK / ${catIssues} Issues / ${cat.checks.length} total
        </span>
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;width:50px;">ID</th>
            <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Check</th>
            <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;width:100px;">Status</th>
            <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;width:60px;">Source</th>
            <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;width:200px;">Notes</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;
  }).join("\n");

  const scanSection = scanRuns.length > 0
    ? `<div style="margin-bottom:24px;">
        <h2 style="font-size:18px;margin:0 0 12px 0;">Scan history</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Type</th>
              <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">URL</th>
              <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Status</th>
              <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Findings</th>
              <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${scanRuns.map((run) => {
              let findingCount = 0;
              try { findingCount = JSON.parse(run.findings as string).length; } catch {}
              return `<tr>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;">${run.scanType}</td>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;">${run.url}</td>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;">${run.status}</td>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;">${findingCount} checks</td>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;">${run.startedAt.toISOString().split("T")[0]}</td>
              </tr>`;
            }).join("\n")}
          </tbody>
        </table>
      </div>`
    : "";

  const date = new Date().toISOString().split("T")[0];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GDPR Audit Report - ${audit.site.name}</title>
  <style>
    @media print {
      body { font-size: 11px; }
      .no-print { display: none; }
      @page { margin: 15mm; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px;
      color: #1f2937;
      line-height: 1.5;
    }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
    <div>
      <h1 style="font-size:24px;margin:0 0 4px 0;">GDPR Audit Report</h1>
      <p style="margin:0;color:#6b7280;font-size:14px;">Generated ${date}</p>
    </div>
    <button class="no-print" onclick="window.print()" style="padding:8px 16px;background:#1f2937;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;">
      Print / Save PDF
    </button>
  </div>

  <div style="margin-bottom:24px;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
    <h2 style="font-size:18px;margin:0 0 12px 0;">Site details</h2>
    <table style="font-size:14px;">
      <tr><td style="padding:2px 16px 2px 0;color:#6b7280;">Site</td><td style="font-weight:500;">${audit.site.name}</td></tr>
      <tr><td style="padding:2px 16px 2px 0;color:#6b7280;">URL</td><td>${audit.site.url}</td></tr>
      <tr><td style="padding:2px 16px 2px 0;color:#6b7280;">Platform</td><td>${audit.site.platform}</td></tr>
      ${audit.site.cookiebotId ? `<tr><td style="padding:2px 16px 2px 0;color:#6b7280;">Cookiebot ID</td><td style="font-family:monospace;">${audit.site.cookiebotId}</td></tr>` : ""}
      ${audit.site.gtmId ? `<tr><td style="padding:2px 16px 2px 0;color:#6b7280;">GTM ID</td><td style="font-family:monospace;">${audit.site.gtmId}</td></tr>` : ""}
      <tr><td style="padding:2px 16px 2px 0;color:#6b7280;">Audit status</td><td>${audit.status}</td></tr>
      ${audit.auditorName ? `<tr><td style="padding:2px 16px 2px 0;color:#6b7280;">Auditor</td><td>${audit.auditorName}</td></tr>` : ""}
    </table>
  </div>

  <div style="margin-bottom:24px;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
    <h2 style="font-size:18px;margin:0 0 8px 0;">Summary</h2>
    <div style="display:flex;gap:24px;font-size:14px;">
      <div><span style="font-size:28px;font-weight:700;color:#16a34a;">${ok}</span><br><span style="color:#6b7280;">OK</span></div>
      <div><span style="font-size:28px;font-weight:700;color:#dc2626;">${issues}</span><br><span style="color:#6b7280;">Issues</span></div>
      <div><span style="font-size:28px;font-weight:700;color:#9ca3af;">${na}</span><br><span style="color:#6b7280;">N/A</span></div>
      <div><span style="font-size:28px;font-weight:700;color:#9ca3af;">${totalChecks - checked}</span><br><span style="color:#6b7280;">Not checked</span></div>
      <div style="margin-left:auto;text-align:right;"><span style="font-size:28px;font-weight:700;">${totalChecks}</span><br><span style="color:#6b7280;">Total checks</span></div>
    </div>
  </div>

  <h2 style="font-size:18px;margin:0 0 12px 0;">Audit results</h2>
  ${categorySections}

  ${scanSection}

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
    Stormfors GDPR Compliance Audit - ${date}
  </div>
</body>
</html>`;

  return html;
}
