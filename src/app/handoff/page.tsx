import { prisma } from "@/lib/db";
import { CHECKLIST } from "@/lib/checklist";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

interface ScanFinding {
  checkKey: string;
  status: string;
  summary: string;
  findings?: { element: string; detail: string; severity: string; pageUrl?: string }[];
}

const checkMap = new Map<string, { label: string; category: string }>();
for (const cat of CHECKLIST) {
  for (const check of cat.checks) {
    checkMap.set(check.key, { label: check.label, category: cat.label });
  }
}

export default async function HandoffPage() {
  const audits = await prisma.audit.findMany({
    where: { status: "in_progress" },
    include: {
      site: true,
      results: true,
      scans: { orderBy: { startedAt: "desc" } },
    },
  });

  const sites = audits
    .map((audit) => {
      const issueResults = audit.results.filter((r) => r.status === "issue");
      if (issueResults.length === 0) return null;

      const latestScanByType = new Map<string, (typeof audit.scans)[0]>();
      for (const scan of audit.scans) {
        if (!latestScanByType.has(scan.scanType)) {
          latestScanByType.set(scan.scanType, scan);
        }
      }

      const scanFindings = new Map<string, ScanFinding>();
      for (const scan of latestScanByType.values()) {
        try {
          const parsed = JSON.parse(scan.findings) as ScanFinding[];
          for (const f of parsed) {
            if (f.status === "issue" || f.status === "blocked") {
              scanFindings.set(f.checkKey, f);
            }
          }
        } catch {}
      }

      const checks = issueResults.map((r) => {
        const info = checkMap.get(r.checkKey);
        const scan = scanFindings.get(r.checkKey);
        const findings = scan?.findings?.filter((f) => f.severity === "error" || f.severity === "warning") ?? [];
        return {
          key: r.checkKey,
          label: info?.label ?? r.checkKey,
          category: info?.category ?? "",
          summary: scan?.summary ?? "",
          internalNote: r.internalNote,
          findings,
        };
      });

      checks.sort((a, b) => a.key.localeCompare(b.key));

      return {
        name: audit.site.name,
        url: audit.site.url,
        auditType: audit.auditType,
        checks,
      };
    })
    .filter(Boolean);

  sites.sort((a, b) => a!.name.localeCompare(b!.name));

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10 text-[13px] text-gray-900 print:px-0 print:py-4">
      <div className="flex items-baseline justify-between mb-6 print:mb-4">
        <h1 className="text-xl font-bold">GDPR Audit - Issues Handoff</h1>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString("sv-SE")} - {sites.length} site{sites.length !== 1 ? "s" : ""} with issues
        </p>
      </div>

      {sites.length === 0 && (
        <p className="text-gray-500">No in-progress audits with issues found.</p>
      )}

      {sites.map((site) => (
        <div key={site!.url} className="mb-8 print:mb-6 break-inside-avoid-page">
          <div className="border-b-2 border-gray-900 pb-1 mb-3">
            <h2 className="text-base font-bold">{site!.name}</h2>
            <p className="text-xs text-gray-500">{site!.url} - {site!.auditType} audit</p>
          </div>

          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-left">
                <th className="py-1.5 pr-2 w-12 font-semibold">Check</th>
                <th className="py-1.5 pr-2 font-semibold">Issue</th>
                <th className="py-1.5 font-semibold w-[200px]">Note</th>
              </tr>
            </thead>
            <tbody>
              {site!.checks.map((check) => (
                <tr key={check.key} className="border-b border-gray-200 align-top">
                  <td className="py-2 pr-2 font-mono font-medium text-gray-700 whitespace-nowrap">
                    {check.key}
                  </td>
                  <td className="py-2 pr-2">
                    <p className="font-medium mb-0.5">{check.label}</p>
                    {check.summary && (
                      <p className="text-gray-600 mb-1">{check.summary}</p>
                    )}
                    {check.findings.length > 0 && (
                      <ul className="space-y-0.5 text-gray-600">
                        {check.findings.map((f, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className={f.severity === "error" ? "text-red-600" : "text-amber-600"}>
                              {f.severity === "error" ? "!" : "?"}
                            </span>
                            <span>
                              {f.detail}
                              {f.pageUrl && (
                                <span className="text-gray-400 ml-1">({new URL(f.pageUrl).pathname})</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="py-2 text-gray-600 whitespace-pre-line">
                    {check.internalNote || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="mt-8 text-center print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
