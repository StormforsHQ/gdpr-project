CREATE TABLE "audit_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "audit_id" TEXT NOT NULL,
    "audit_type" TEXT NOT NULL DEFAULT 'full',
    "stats_ok" INTEGER NOT NULL DEFAULT 0,
    "stats_issues" INTEGER NOT NULL DEFAULT 0,
    "stats_na" INTEGER NOT NULL DEFAULT 0,
    "stats_not_checked" INTEGER NOT NULL DEFAULT 0,
    "category_data" TEXT NOT NULL DEFAULT '[]',
    "trigger" TEXT NOT NULL DEFAULT 'scan',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_snapshots_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "audit_snapshots_audit_id_created_at_idx" ON "audit_snapshots"("audit_id", "created_at");
