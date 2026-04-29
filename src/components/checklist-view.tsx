"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckItem, type FixInfo } from "@/components/check-item";
import { CheckGuideDrawer } from "@/components/check-guide-drawer";
import { ScanResultsDrawer } from "@/components/scan-results-drawer";
import { CHECKLIST, type CheckStatus } from "@/lib/checklist";
import { runPageScan, runSingleAICheck, runAllAIChecks, checkOpenRouterCredits, runCookiebotScan } from "@/app/actions/scan";
import { isValidUrl } from "@/lib/url";
import { saveCheckResult, saveScanRun } from "@/app/actions/audits";
import { getFixAvailability, applyFix, type FixAvailability } from "@/app/actions/fixes";
import type { ScanResult, CheckResult } from "@/lib/scanner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useErrorLog, ErrorLogDrawer } from "@/components/error-log";
import { ChevronDown, ChevronRight, Scan, Loader2, Sparkles, AlertCircle, History, Clock } from "lucide-react";

type CheckEntry = { status: CheckStatus; notes: string; source: "manual" | "scan" | "ai" };
type CheckState = Record<string, CheckEntry>;

export type ScanRunEntry = {
  id: string;
  scanType: string;
  url: string;
  status: string;
  findings: string;
  startedAt: Date;
  completedAt: Date | null;
};

interface ChecklistViewProps {
  siteUrl?: string;
  siteId?: string;
  auditId?: string;
  initialStates?: Record<string, { status: string; notes: string; source: string }>;
  initialScanRuns?: ScanRunEntry[];
  siteFields?: { cookiebotId?: string | null; gtmId?: string | null };
}

export function ChecklistView({ siteUrl, siteId, auditId, initialStates, initialScanRuns, siteFields }: ChecklistViewProps) {
  const { errors, addError } = useErrorLog();
  const [errorLogOpen, setErrorLogOpen] = useState(false);
  const [scanRuns, setScanRuns] = useState<ScanRunEntry[]>(initialScanRuns ?? []);
  const [checkStates, setCheckStates] = useState<CheckState>(() => {
    if (!initialStates) return {};
    const states: CheckState = {};
    for (const [key, value] of Object.entries(initialStates)) {
      states[key] = {
        status: value.status as CheckStatus,
        notes: value.notes,
        source: (value.source as "manual" | "scan" | "ai") || "manual",
      };
    }
    return states;
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CHECKLIST.map((c) => c.id))
  );
  const [guideKey, setGuideKey] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [scanUrl, setScanUrl] = useState(siteUrl || "");
  const [scanning, setScanning] = useState(false);
  const [aiScanning, setAiScanning] = useState(false);
  const [runningChecks, setRunningChecks] = useState<Set<string>>(new Set());
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [lastScanType, setLastScanType] = useState<"page-scan" | "ai-agent" | null>(null);
  const [scanDrawerOpen, setScanDrawerOpen] = useState(false);
  const [scanDrawerCheckKey, setScanDrawerCheckKey] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"scan" | "ai" | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [creditWarning, setCreditWarning] = useState<string | null>(null);
  const [filterIssues, setFilterIssues] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fixAvailability, setFixAvailability] = useState<Record<string, FixAvailability>>({});
  const [fixingChecks, setFixingChecks] = useState<Set<string>>(new Set());
  const [lastSkippedCount, setLastSkippedCount] = useState(0);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    getFixAvailability().then(setFixAvailability).catch(() => {});
  }, []);

  const openGuide = (key: string) => {
    setGuideKey(key);
    setGuideOpen(true);
  };

  const getCheckState = (key: string): CheckEntry =>
    checkStates[key] ?? { status: "not_checked" as CheckStatus, notes: "", source: "manual" as const };

  const persistCheck = useCallback(
    (key: string, status: CheckStatus, notes: string, source: "manual" | "scan" | "ai" = "manual") => {
      if (!auditId) return;

      if (saveTimers.current[key]) {
        clearTimeout(saveTimers.current[key]);
      }

      saveTimers.current[key] = setTimeout(() => {
        saveCheckResult(auditId, key, status, notes, source).catch((err) => {
          addError("save", `Failed to save check ${key}`, err instanceof Error ? err.message : "Unknown error");
        });
      }, 500);
    },
    [auditId, addError]
  );

  const updateCheck = (key: string, field: "status" | "notes", value: string) => {
    setCheckStates((prev) => {
      const current = prev[key] ?? { status: "not_checked" as CheckStatus, notes: "", source: "manual" as const };
      const updated = { ...current, [field]: value, source: "manual" as const };
      persistCheck(key, updated.status as CheckStatus, updated.notes, "manual");
      return { ...prev, [key]: updated };
    });
  };

  const applyCheckResults = (results: CheckResult[], source: "scan" | "ai"): number => {
    let skipped = 0;
    setCheckStates((prev) => {
      const next = { ...prev };
      for (const check of results) {
        const existing = prev[check.checkKey];
        if (existing?.source === "manual" && existing.status !== "not_checked") {
          skipped++;
          continue;
        }
        const findingSummary = check.findings
          .map((f) => f.detail)
          .join("; ");
        const status = check.status as CheckStatus;
        const notes = findingSummary || check.summary;
        next[check.checkKey] = { status, notes, source };
        persistCheck(check.checkKey, status, notes, source);
      }
      return next;
    });

    setScanResult((prev) => {
      if (!prev) {
        return {
          url: scanUrl,
          scannedAt: new Date().toISOString(),
          checks: results,
        };
      }
      const existingKeys = new Set(prev.checks.map((c) => c.checkKey));
      const newChecks = results.filter((r) => !existingKeys.has(r.checkKey));
      const updatedChecks = prev.checks.map((c) => {
        const updated = results.find((r) => r.checkKey === c.checkKey);
        return updated || c;
      });
      return {
        ...prev,
        checks: [...updatedChecks, ...newChecks],
      };
    });

    return skipped;
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getCategoryStats = (categoryId: string) => {
    const category = CHECKLIST.find((c) => c.id === categoryId);
    if (!category) return { total: 0, checked: 0, issues: 0 };
    const total = category.checks.length;
    let checked = 0;
    let issues = 0;
    for (const check of category.checks) {
      const state = getCheckState(check.key);
      if (state.status !== "not_checked") checked++;
      if (state.status === "issue") issues++;
    }
    return { total, checked, issues };
  };

  const hasExistingResults = Object.values(checkStates).some(
    (s) => s.status !== "not_checked"
  );

  const executeScan = async () => {
    setScanning(true);
    try {
      const result = await runPageScan(scanUrl, siteId);
      if (!result.error) {
        setLastScanType("page-scan");
        setScanResult(result);
        let totalSkipped = applyCheckResults(result.checks, "scan");
        const failedChecks = result.checks.filter((c) => c.status === "na" && c.findings.some((f) => f.severity === "warning"));
        for (const check of failedChecks) {
          addError("scan", `Check ${check.checkKey} failed`, check.summary);
        }
        if (auditId) {
          const findings = result.checks.map((c) => ({ checkKey: c.checkKey, status: c.status, summary: c.summary }));
          const run = await saveScanRun(auditId, "page-scan", scanUrl, findings);
          setScanRuns((prev) => [run, ...prev]);
        }

        const cbid = result.detectedCookiebotId || siteFields?.cookiebotId;
        if (cbid) {
          try {
            const cbResults = await runCookiebotScan(cbid);
            totalSkipped += applyCheckResults(cbResults, "scan");
            if (auditId) {
              const cbFindings = cbResults.map((c) => ({ checkKey: c.checkKey, status: c.status, summary: c.summary }));
              const cbRun = await saveScanRun(auditId, "cookiebot", scanUrl, cbFindings);
              setScanRuns((prev) => [cbRun, ...prev]);
            }
          } catch (err) {
            addError("scan", "Cookiebot scan failed", err instanceof Error ? err.message : "Unknown error");
          }
        }
        setLastSkippedCount(totalSkipped);
      } else {
        setScanResult(result);
        addError("scan", `Page scan failed: ${result.error}`, scanUrl);
        if (auditId) {
          const run = await saveScanRun(auditId, "page-scan", scanUrl, [], result.error);
          setScanRuns((prev) => [run, ...prev]);
        }
      }
    } catch (err) {
      addError("scan", "Page scan crashed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setScanning(false);
    }
  };

  const executeAIScan = async () => {
    setAiScanning(true);
    try {
      const results = await runAllAIChecks(scanUrl);
      setLastScanType("ai-agent");
      const skipped = applyCheckResults(results, "ai");
      setLastSkippedCount(skipped);
      const failedChecks = results.filter((c) => c.status === "na" && c.findings.some((f) => f.severity === "warning"));
      for (const check of failedChecks) {
        addError("ai", `AI check ${check.checkKey} failed`, check.summary);
      }
      if (auditId) {
        const findings = results.map((c) => ({ checkKey: c.checkKey, status: c.status, summary: c.summary }));
        const run = await saveScanRun(auditId, "ai-agent", scanUrl, findings);
        setScanRuns((prev) => [run, ...prev]);
      }
    } catch (err) {
      addError("ai", "AI analysis crashed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAiScanning(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError("URL is required");
      return false;
    }
    if (!isValidUrl(url)) {
      setUrlError("Enter a valid domain (e.g. example.com)");
      return false;
    }
    setUrlError(null);
    return true;
  };

  const handleScan = () => {
    if (!validateUrl(scanUrl)) return;
    if (hasExistingResults) {
      setConfirmAction("scan");
    } else {
      executeScan();
    }
  };

  const handleAIScan = async () => {
    if (!validateUrl(scanUrl)) return;
    setCreditWarning(null);

    const credits = await checkOpenRouterCredits();
    if (!credits.available) {
      setCreditWarning(credits.error || "No OpenRouter credits remaining");
      return;
    }
    if (credits.credits < 1) {
      setCreditWarning(`Low OpenRouter credits: $${credits.credits} remaining`);
    }

    if (hasExistingResults) {
      setConfirmAction("ai");
    } else {
      executeAIScan();
    }
  };

  const handleConfirm = () => {
    if (confirmAction === "scan") executeScan();
    if (confirmAction === "ai") executeAIScan();
    setConfirmAction(null);
  };

  const handleApplyFix = async (checkKey: string) => {
    setFixingChecks((prev) => new Set(prev).add(checkKey));
    try {
      const result = await applyFix(checkKey, siteFields?.cookiebotId, siteFields?.gtmId);
      if (result.success) {
        updateCheck(checkKey, "status", "ok");
        updateCheck(checkKey, "notes", `Auto-fixed: ${result.message}`);
      } else {
        addError("fix", `Fix for ${checkKey} failed`, result.message);
      }
    } catch (err) {
      addError("fix", `Fix for ${checkKey} crashed`, err instanceof Error ? err.message : "Unknown error");
    } finally {
      setFixingChecks((prev) => {
        const next = new Set(prev);
        next.delete(checkKey);
        return next;
      });
    }
  };

  const handleRunCheck = async (checkKey: string, automation: string) => {
    if (!scanUrl.trim()) return;

    if (automation === "ai-agent") {
      const credits = await checkOpenRouterCredits();
      if (!credits.available) {
        setCreditWarning(credits.error || "No OpenRouter credits remaining");
        return;
      }
    }

    setRunningChecks((prev) => new Set(prev).add(checkKey));
    try {
      if (automation === "cookiebot-api") {
        const cbid = siteFields?.cookiebotId;
        if (!cbid) {
          addError("scan", `Check ${checkKey} requires Cookiebot ID`, "Add a Cookiebot ID to the site settings");
          return;
        }
        const results = await runCookiebotScan(cbid);
        const checkResult = results.find((c) => c.checkKey === checkKey);
        if (checkResult) {
          applyCheckResults([checkResult], "scan");
        }
      } else if (automation === "page-scan") {
        const result = await runPageScan(scanUrl, siteId);
        if (!result.error) {
          const checkResult = result.checks.find((c) => c.checkKey === checkKey);
          if (checkResult) {
            applyCheckResults([checkResult], "scan");
          }
        } else {
          addError("scan", `Scan check ${checkKey} failed`, result.error);
        }
      } else {
        const result = await runSingleAICheck(checkKey, scanUrl);
        applyCheckResults([result], "ai");
        if (result.status === "na" && result.findings.some((f) => f.severity === "warning")) {
          addError("ai", `AI check ${checkKey} failed`, result.summary);
        }
      }
    } catch (err) {
      addError(automation === "page-scan" ? "scan" : "ai", `Check ${checkKey} crashed`, err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRunningChecks((prev) => {
        const next = new Set(prev);
        next.delete(checkKey);
        return next;
      });
    }
  };

  const getScanCheckResult = (key: string): CheckResult | undefined => {
    return scanResult?.checks.find((c) => c.checkKey === key);
  };

  const openScanDetails = (key: string) => {
    setScanDrawerCheckKey(key);
    setScanDrawerOpen(true);
  };

  const totalChecks = CHECKLIST.reduce((sum, c) => sum + c.checks.length, 0);
  const totalChecked = Object.values(checkStates).filter(
    (s) => s.status !== "not_checked"
  ).length;
  const issueEntries = Object.values(checkStates).filter((s) => s.status === "issue");
  const totalIssues = issueEntries.length;
  const issuesBySource = {
    scan: issueEntries.filter((s) => s.source === "scan").length,
    ai: issueEntries.filter((s) => s.source === "ai").length,
    manual: issueEntries.filter((s) => s.source === "manual").length,
  };

  const scannedCheckCount = scanResult?.checks.length ?? 0;
  const scanIssueCount = scanResult?.checks.filter((c) => c.status === "issue").length ?? 0;
  const scanFailedCount = scanResult?.checks.filter((c) => c.status === "na" && c.findings.some((f) => f.severity === "warning")).length ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Enter site URL to scan (e.g. example.com)"
              value={scanUrl}
              onChange={(e) => { setScanUrl(e.target.value); setUrlError(null); }}
              className="flex-1 h-9 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
            />
            <Button
              onClick={handleScan}
              disabled={scanning || !scanUrl.trim()}
              size="sm"
              className="gap-2"
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Scan className="h-4 w-4" />
              )}
              {scanning ? "Scanning..." : "Scan site"}
            </Button>
            <Button
              onClick={handleAIScan}
              disabled={aiScanning || !scanUrl.trim()}
              size="sm"
              variant="secondary"
              className="gap-2"
            >
              {aiScanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {aiScanning ? "Analyzing..." : "AI Analyze"}
            </Button>
          </div>
          {scanResult && !scanResult.error && (
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>{lastScanType === "ai-agent" ? "AI scan" : lastScanType === "page-scan" ? "Page scan" : "Scanned"}: {scanResult.url}</span>
              <span>{scannedCheckCount} checks run</span>
              {scanIssueCount > 0 && (
                <Badge variant="destructive" className="text-xs">{scanIssueCount} issue{scanIssueCount !== 1 ? "s" : ""}</Badge>
              )}
              {scanFailedCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400">{scanFailedCount} failed</Badge>
              )}
              {scanIssueCount === 0 && scanFailedCount === 0 && (
                <Badge variant="secondary" className="text-xs bg-green-500/15 text-green-600 dark:text-green-400">All clear</Badge>
              )}
              {lastSkippedCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400">{lastSkippedCount} skipped (manually reviewed)</span>
              )}
            </div>
          )}
          {urlError && (
            <div className="flex items-center gap-1.5 mt-3">
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              <p className="text-xs text-destructive">{urlError}</p>
            </div>
          )}
          {creditWarning && (
            <div className="flex items-center gap-1.5 mt-3">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs text-amber-600 dark:text-amber-400">{creditWarning}</p>
            </div>
          )}
          {scanResult?.error && (
            <p className="mt-3 text-xs text-destructive">Scan failed: {scanResult.error}</p>
          )}
        </CardContent>
      </Card>

      {scanRuns.length > 0 && (
        <div>
          <button
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-3.5 w-3.5" />
            {scanRuns.length} scan run{scanRuns.length !== 1 ? "s" : ""}
            {showHistory ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1">
              {scanRuns.map((run) => {
                const findings = JSON.parse(run.findings) as { checkKey: string; status: string; summary: string }[];
                const issues = findings.filter((f) => f.status === "issue").length;
                return (
                  <div key={run.id} className="flex items-center gap-3 text-xs text-muted-foreground px-2 py-1.5 rounded-md bg-muted/50">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{new Date(run.startedAt).toLocaleString()}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {run.scanType === "page-scan" ? "Scan" : "AI"}
                    </Badge>
                    <span className="truncate">{run.url}</span>
                    {run.status === "completed" ? (
                      <>
                        <span>{findings.length} checks</span>
                        {issues > 0 && <Badge variant="destructive" className="text-[10px]">{issues}</Badge>}
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-600">Failed</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          Progress: {totalChecked}/{totalChecks} checked
        </span>
        {totalIssues > 0 && (
          <button onClick={() => setFilterIssues((f) => !f)}>
            <Badge
              variant={filterIssues ? "default" : "destructive"}
              className={`cursor-pointer ${filterIssues ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
            >
              {filterIssues ? "Showing issues only" : (
                <>
                  {totalIssues} issue{totalIssues !== 1 ? "s" : ""} total
                  {totalIssues > 0 && (() => {
                    const parts: string[] = [];
                    if (issuesBySource.scan > 0) parts.push(`${issuesBySource.scan} auto`);
                    if (issuesBySource.ai > 0) parts.push(`${issuesBySource.ai} AI`);
                    if (issuesBySource.manual > 0) parts.push(`${issuesBySource.manual} manual`);
                    return parts.length > 0 ? ` (${parts.join(", ")})` : "";
                  })()}
                </>
              )}
            </Badge>
          </button>
        )}
        {filterIssues && totalIssues === 0 && (
          <button onClick={() => setFilterIssues(false)}>
            <Badge variant="secondary" className="cursor-pointer">
              No issues - click to clear filter
            </Badge>
          </button>
        )}
        {errors.length > 0 && (
          <button
            className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline"
            onClick={() => setErrorLogOpen(true)}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.length} error{errors.length !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {CHECKLIST.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const stats = getCategoryStats(category.id);

        if (filterIssues && stats.issues === 0) return null;

        const visibleChecks = filterIssues
          ? category.checks.filter((c) => getCheckState(c.key).status === "issue")
          : category.checks;

        return (
          <Card key={category.id}>
            <CardHeader
              className="cursor-pointer hover:bg-accent/30 transition-colors py-3"
              onClick={() => toggleCategory(category.id)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <CardTitle className="text-sm flex-1">
                  {category.id}. {category.label}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {stats.issues > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.issues}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {stats.checked}/{stats.total}
                  </span>
                </div>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="p-0">
                {visibleChecks.map((check) => {
                  const state = getCheckState(check.key);
                  const scanCheck = getScanCheckResult(check.key);
                  const fa = fixAvailability[check.key];
                  const fixInfo: FixInfo | undefined = fa
                    ? {
                        label: fa.fix.label,
                        description: fa.fix.description,
                        ready: fa.ready,
                        missingServices: fa.missingServices,
                        requires: fa.fix.requires,
                      }
                    : undefined;
                  return (
                    <CheckItem
                      key={check.key}
                      check={check}
                      status={state.status}
                      notes={state.notes}
                      scanResult={scanCheck}
                      isRunning={runningChecks.has(check.key)}
                      isFixing={fixingChecks.has(check.key)}
                      siteFields={siteFields}
                      fixInfo={fixInfo}
                      onStatusChange={(s) => updateCheck(check.key, "status", s)}
                      onNotesChange={(n) => updateCheck(check.key, "notes", n)}
                      onOpenGuide={openGuide}
                      onViewScanDetails={scanCheck ? openScanDetails : undefined}
                      onRunCheck={(check.automation === "ai-agent" || check.automation === "page-scan" || check.automation === "cookiebot-api") ? (key) => handleRunCheck(key, check.automation) : undefined}
                      onApplyFix={handleApplyFix}
                    />
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}

      {!filterIssues && (
        <Card className="border-dashed">
          <CardHeader
            className="cursor-pointer hover:bg-accent/30 transition-colors py-3"
            onClick={() => setExpandedCategories((prev) => {
              const next = new Set(prev);
              if (next.has("_not_covered")) next.delete("_not_covered");
              else next.add("_not_covered");
              return next;
            })}
          >
            <div className="flex items-center gap-3">
              {expandedCategories.has("_not_covered") ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <CardTitle className="text-sm flex-1 text-muted-foreground">
                Areas outside this audit
              </CardTitle>
            </div>
          </CardHeader>
          {expandedCategories.has("_not_covered") && (
            <CardContent className="pt-0 space-y-3 text-sm text-muted-foreground">
              <p>
                This audit covers website cookie consent, script management, privacy policies, and
                third-party integrations. The following GDPR-related areas require separate audits:
              </p>
              <ul className="space-y-2 list-none">
                <li>
                  <span className="font-medium text-foreground">Email marketing compliance</span>
                  {" "}- Unsubscribe links in every email (GDPR Art. 21), opt-in/double opt-in flows,
                  email consent records. Requires access to the email platform (e.g. Mailchimp, HubSpot, Brevo).
                </li>
                <li>
                  <span className="font-medium text-foreground">Data retention and cleanup</span>
                  {" "}- Automated deletion of inactive data after retention periods expire.
                  Requires access to backend systems and database infrastructure.
                </li>
                <li>
                  <span className="font-medium text-foreground">Deletion request processing</span>
                  {" "}- Automated or manual handling of GDPR erasure requests (Art. 17).
                  Verifying that deletion requests are processed within 30 days and data is actually removed
                  from all systems including backups.
                </li>
                <li>
                  <span className="font-medium text-foreground">Data pipeline opt-out propagation</span>
                  {" "}- When a user opts out or requests deletion, all downstream systems (scrapers,
                  CRMs, analytics, data warehouses) must respect it. Requires mapping the full data flow.
                </li>
                <li>
                  <span className="font-medium text-foreground">Internal data processing</span>
                  {" "}- Employee data handling, HR systems, internal tools, physical security
                  (CCTV, access logs). Falls under the organization's general GDPR compliance program.
                </li>
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      <CheckGuideDrawer
        checkKey={guideKey}
        open={guideOpen}
        onOpenChange={setGuideOpen}
      />

      <ScanResultsDrawer
        checkKey={scanDrawerCheckKey}
        scanResult={scanResult}
        open={scanDrawerOpen}
        onOpenChange={setScanDrawerOpen}
      />

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "scan" ? "Re-run full scan?" : "Re-run AI analysis?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite existing {confirmAction === "scan" ? "scan" : "AI analysis"} results.
              Manually reviewed checks will be preserved.
              To re-run individual checks instead, use the Re-run button on each check.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ErrorLogDrawer
        open={errorLogOpen}
        onOpenChange={setErrorLogOpen}
      />
    </div>
  );
}
