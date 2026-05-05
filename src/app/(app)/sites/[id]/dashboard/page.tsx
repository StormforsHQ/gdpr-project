import { getSite } from "@/app/actions/sites";
import { getLatestAudit } from "@/app/actions/audits";
import { getDashboardData } from "@/app/actions/dashboard";
import { ComplianceDashboard } from "@/components/compliance-dashboard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  const site = await getSite(id);
  if (!site) return <div className="p-6">Site not found</div>;

  const audit = await getLatestAudit(site.id);
  if (!audit) return <div className="p-6">No audit found</div>;

  const data = await getDashboardData(audit.id);
  if (!data) return <div className="p-6">Could not load dashboard data</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/sites/${id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold">{site.name}</h1>
        <span className="text-sm text-muted-foreground">Compliance Dashboard</span>
      </div>
      <ComplianceDashboard data={data} />
    </div>
  );
}
