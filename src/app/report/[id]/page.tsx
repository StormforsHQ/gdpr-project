import { getSite } from "@/app/actions/sites";
import { getLatestAudit } from "@/app/actions/audits";
import { getLatestReport } from "@/app/actions/report";
import { ReportView } from "@/components/report-view";
import { ReportEmpty } from "@/components/report-empty";

export const dynamic = "force-dynamic";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const site = await getSite(id);
  if (!site) return <div className="p-12 text-center text-gray-500">Site not found.</div>;

  const audit = await getLatestAudit(site.id);
  if (!audit) return <div className="p-12 text-center text-gray-500">No audit found for this site.</div>;

  const report = await getLatestReport(audit.id);

  if (!report) {
    return <ReportEmpty siteId={site.id} auditId={audit.id} />;
  }

  return <ReportView report={report} siteId={site.id} auditId={audit.id} />;
}
