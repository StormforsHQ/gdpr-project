-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "executive_summary" TEXT NOT NULL DEFAULT '',
    "conclusion" TEXT NOT NULL DEFAULT '',
    "snapshot_html" TEXT NOT NULL,
    "stats_ok" INTEGER NOT NULL DEFAULT 0,
    "stats_issues" INTEGER NOT NULL DEFAULT 0,
    "stats_na" INTEGER NOT NULL DEFAULT 0,
    "stats_not_checked" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
