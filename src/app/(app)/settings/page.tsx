"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Loader2, CheckCircle2, AlertCircle, Trash2, X } from "lucide-react";
import { importDatabase } from "@/app/actions/backup";
import { useErrorLog, type ErrorEntry } from "@/components/error-log";

const SOURCE_LABELS: Record<ErrorEntry["source"], string> = {
  scan: "Page scan",
  ai: "AI check",
  save: "Save",
  system: "System",
  fix: "Auto-fix",
};

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { errors, clearErrors, dismissError } = useErrorLog();

  async function handleExport() {
    setExporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/backup/export");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "gdpr-backup.zip";
      a.click();
      URL.revokeObjectURL(url);
      setResult({ type: "success", message: "Backup downloaded" });
    } catch (error) {
      setResult({
        type: "error",
        message: error instanceof Error ? error.message : "Export failed",
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.set("backup", file);
      const res = await importDatabase(formData);

      if (!res.success) {
        throw new Error(res.error || "Import failed");
      }

      const c = res.counts!;
      setResult({
        type: "success",
        message: `Restored ${c.sites} sites, ${c.audits} audits, ${c.checkResults} check results, ${c.scanRuns} scan runs, ${c.reports} reports`,
      });
    } catch (error) {
      setResult({
        type: "error",
        message: error instanceof Error ? error.message : "Import failed",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-medium">Database backup</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Export the entire database as a zip of CSV files. Use the import to
            restore from a previous backup. Existing records are updated, new
            records are added.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} disabled={exporting || importing}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Exporting..." : "Export backup"}
          </Button>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              onChange={handleImport}
              className="hidden"
              id="backup-upload"
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={exporting || importing}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing ? "Importing..." : "Import backup"}
            </Button>
          </div>
        </div>

        {result && (
          <div
            className={`flex items-start gap-2 rounded-md p-3 text-sm ${
              result.type === "success"
                ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
                : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
            }`}
          >
            {result.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            {result.message}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium flex items-center gap-2">
              Error log
              {errors.length > 0 && (
                <Badge variant="destructive" className="text-xs">{errors.length}</Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Errors from page scans, AI checks, auto-fixes, and saves during this session.
            </p>
          </div>
          {errors.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearErrors}>
              <Trash2 className="h-3 w-3" />
              Clear all
            </Button>
          )}
        </div>

        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No errors recorded this session
          </p>
        ) : (
          <div className="divide-y rounded-md border">
            {errors.map((err) => (
              <div key={err.id} className="px-4 py-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {SOURCE_LABELS[err.source]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {err.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs">{err.message}</p>
                    {err.detail && (
                      <p className="text-[11px] text-muted-foreground break-all">{err.detail}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => dismissError(err.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
