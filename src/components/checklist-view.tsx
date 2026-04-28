"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckItem } from "@/components/check-item";
import { CheckGuideDrawer } from "@/components/check-guide-drawer";
import { ScanResultsDrawer } from "@/components/scan-results-drawer";
import { CHECKLIST, type CheckStatus } from "@/lib/checklist";
import { runPageScan, runSingleAICheck, runAllAIChecks, checkOpenRouterCredits } from "@/app/actions/scan";
import { isValidUrl } from "@/lib/url";
import { saveCheckResult } from "@/app/actions/audits";
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
import { ChevronDown, ChevronRight, Scan, Loader2, Sparkles, AlertCircle } from "lucide-react";

type CheckState = Record<string, { status: CheckStatus; notes: string }>;

interface ChecklistViewProps {
  siteUrl?: string;
  auditId?: string;
  initialStates?: Record<string, { status: string; notes: string }>;
  siteFields?: { cookiebotId?: string | null; gtmId?: string | null };
}

export function ChecklistView({ siteUrl, auditId, initialStates, siteFields }: ChecklistViewProps) {
  const { errors, addError } = useErrorLog();
  const [errorLogOpen, setErrorLogOpen] = useState(false);
  const [checkStates, setCheckStates] = useState<CheckState>(() => {
    if (!initialStates) return {};
    const states: CheckState = {};
    for (const [key, value] of Object.entries(initialStates)) {
      states[key] = {
        status: value.status as CheckStatus,
        notes: value.notes,
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
  const [scanDrawerOpen, setScanDrawerOpen] = useState(false);
  const [scanDrawerCheckKey, setScanDrawerCheckKey] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"scan" | "ai" | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [creditWarning, setCreditWarning] = useState<string | null>(null);
  const [filterIssues, setFilterIssues] = useState(false);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const openGuide = (key: string) => {
    setGuideKey(key);
    setGuideOpen(true);
  };

  const getCheckState = (key: string) =>
    checkStates[key] ?? { status: "not_checked" as CheckStatus, notes: "" };

  const persistCheck = useCallback(
    (key: string, status: CheckStatus, notes: string) => {
      if (!auditId) return;

      if (saveTimers.current[key]) {
        clearTimeout(saveTimers.current[key]);
      }

      saveTimers.current[key] = setTimeout(() => {
        saveCheckResult(auditId, key, status, notes).catch((err) => {
          addError("save", `Failed to save check ${key}`, err instanceof Error ? err.message : "Unknown error");
        });
      }, 500);
    },
    [auditId, addError]
  );

  const updateCheck = (key: string, field: "status" | "notes", value: string) => {
    setCheckStates((prev) => {
      const current = prev[key] ?? { status: "not_checked" as CheckStatus, notes: "" };
      const updated = { ...current, [field]: value };
      persistCheck(key, updated.status as CheckStatus, updated.notes);
      return { ...prev, [key]: updated };
    });
  };

  const applyCheckResults = (results: CheckResult[]) => {
    setCheckStates((prev) => {
      const next = { ...prev };
      for (const check of results) {
        const findingSummary = check.findings
          .map((f) => f.detail)
          .join("; ");
        const status = check.status as CheckStatus;
        const notes = findingSummary || check.summary;
        next[check.checkKey] = { status, notes };
        persistCheck(check.checkKey, status, notes);
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
      const result = await runPageScan(scanUrl);
      if (!result.error) {
        setScanResult(result);
        applyCheckResults(result.checks);
        const failedChecks = result.checks.filter((c) => c.status === "na" && c.findings.some((f) => f.severity === "warning"));
        for (const check of failedChecks) {
          addError("scan", `Check ${check.checkKey} failed`, check.summary);
        }
      } else {
        setScanResult(result);
        addError("scan", `Page scan failed: ${result.error}`, scanUrl);
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
      applyCheckResults(results);
      const failedChecks = results.filter((c) => c.status === "na" && c.findings.some((f) => f.severity === "warning"));
      for (const check of failedChecks) {
        addError("ai", `AI check ${check.checkKey} failed`, check.summary);
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

  const handleRunCheck = async (checkKey: string) => {
    if (!scanUrl.trim()) return;

    const credits = await checkOpenRouterCredits();
    if (!credits.available) {
      setCreditWarning(credits.error || "No OpenRouter credits remaining");
      return;
    }

    setRunningChecks((prev) => new Set(prev).add(checkKey));
    try {
      const result = await runSingleAICheck(checkKey, scanUrl);
      applyCheckResults([result]);
      if (result.status === "na" && result.findings.some((f) => f.severity === "warning")) {
        addError("ai", `AI check ${checkKey} failed`, result.summary);
      }
    } catch (err) {
      addError("ai", `AI check ${checkKey} crashed`, err instanceof Error ? err.message : "Unknown error");
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
  const totalIssues = Object.values(checkStates).filter(
    (s) => s.status === "issue"
  ).length;

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
              <span>Scanned: {scanResult.url}</span>
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
              {filterIssues ? "Showing issues only" : `${totalIssues} issue${totalIssues !== 1 ? "s" : ""}`}
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
                  return (
                    <CheckItem
                      key={check.key}
                      check={check}
                      status={state.status}
                      notes={state.notes}
                      scanResult={scanCheck}
                      isRunning={runningChecks.has(check.key)}
                      siteFields={siteFields}
                      onStatusChange={(s) => updateCheck(check.key, "status", s)}
                      onNotesChange={(n) => updateCheck(check.key, "notes", n)}
                      onOpenGuide={openGuide}
                      onViewScanDetails={scanCheck ? openScanDetails : undefined}
                      onRunCheck={check.automation === "ai-agent" ? handleRunCheck : undefined}
                    />
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}

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
