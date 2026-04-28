import { getSite } from "@/app/actions/sites";
import { getLatestAudit } from "@/app/actions/audits";
import { getOrCreateReport, getReportById, listReports } from "@/app/actions/report";
import { ReportView } from "@/components/report-view";

export const dynamic = "force-dynamic";

interface ReportPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}

export default async function ReportPage({ params, searchParams }: ReportPageProps) {
  const { id } = await params;
  const { version } = await searchParams;

  const site = await getSite(id);
  if (!site) return <div style={{ padding: "48px", textAlign: "center", color: "#888" }}>Site not found.</div>;

  const audit = await getLatestAudit(site.id);
  if (!audit) return <div style={{ padding: "48px", textAlign: "center", color: "#888" }}>No audit found for this site.</div>;

  if (version) {
    const report = await getReportById(version);
    if (!report) return <div style={{ padding: "48px", textAlign: "center", color: "#888" }}>Report version not found.</div>;
    const versions = await listReports(audit.id);
    return <ReportView report={report} siteId={site.id} versions={versions} />;
  }

  const reportId = await getOrCreateReport(audit.id);
  if (!reportId) return <div style={{ padding: "48px", textAlign: "center", color: "#888" }}>Could not generate report.</div>;

  const report = await getReportById(reportId);
  if (!report) return <div style={{ padding: "48px", textAlign: "center", color: "#888" }}>Report not found.</div>;

  const versions = await listReports(audit.id);

  return <ReportView report={report} siteId={site.id} versions={versions} />;
}
