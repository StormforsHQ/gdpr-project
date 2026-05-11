"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckItem, type FixInfo } from "@/components/check-item";
import { CheckGuideDrawer } from "@/components/check-guide-drawer";
import { ScanResultsDrawer } from "@/components/scan-results-drawer";
import { CHECKLIST, AUTOMATION_CONFIG, COVERAGE_TYPES, getEssentialChecks, type CheckStatus, type CoverageType } from "@/lib/checklist";
import { CHECK_REQUIREMENTS } from "@/lib/glossary";
import { runPageScan, runSingleAICheck, runAllAIChecks, checkOpenRouterCredits, runCookiebotScan, runGtmScan } from "@/app/actions/scan";
import { isValidUrl } from "@/lib/url";
import { saveCheckResult, saveInternalNote, saveScanRun, deleteScanRun, deleteAllScanRuns, updateAuditType, resetAllChecks, saveAuditNotes } from "@/app/actions/audits";
import { getFixAvailability, applyFix, analyzeFix, verifyGtmSetup, pushGtmSnippetToSite, deleteApiManagedScript, type FixAvailability, type FixAnalysisResult } from "@/app/actions/fixes";
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
import { useErrorLog } from "@/components/error-log";
import { ChecklistLegend } from "@/components/checklist-legend";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, Scan, Loader2, AlertCircle, History, Clock, Trash2, X, RotateCcw, Check, MessageSquare, UserCircle } from "lucide-react";


const CLIENT_CONSENT_CHECKS = [
  "B5",
  "C1", "C2", "C3", "C4", "C5", "C6",
  "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9",
  "H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8",
  "K1", "K2", "K3", "K4",
];

type CheckEntry = { status: CheckStatus; notes: string; internalNote: string; source: "manual" | "scan" | "ai" };
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
  auditType?: "basic" | "full";
  coverageType?: CoverageType;
  initialStates?: Record<string, { status: string; notes: string; internalNote?: string; source: string }>;
  initialScanRuns?: ScanRunEntry[];
  initialAuditNotes?: string;
  siteFields?: { platform?: string | null; webflowId?: string | null; cookiebotId?: string | null; gtmId?: string | null };
}

export function ChecklistView({ siteUrl, siteId, auditId, auditType: initialAuditType = "full", coverageType = "unknown", initialStates, initialScanRuns, initialAuditNotes = "", siteFields: initialSiteFields }: ChecklistViewProps) {
  const { errors, addError, clearErrors } = useErrorLog();
  const [auditType, setAuditType] = useState<"basic" | "full">(initialAuditType);
  const [showAllChecks, setShowAllChecks] = useState(coverageType === "unknown");
  const essentialChecks = getEssentialChecks(coverageType);
  const [siteFields, setSiteFields] = useState(initialSiteFields);

  useEffect(() => {
    setShowAllChecks(coverageType === "unknown");
  }, [coverageType]);

  useEffect(() => {
    setSiteFields(initialSiteFields);
  }, [initialSiteFields?.cookiebotId, initialSiteFields?.gtmId, initialSiteFields?.webflowId, initialSiteFields?.platform]);

  const [scanRuns, setScanRuns] = useState<ScanRunEntry[]>(initialScanRuns ?? []);
  const [checkStates, setCheckStates] = useState<CheckState>(() => {
    if (!initialStates) return {};
    const states: CheckState = {};
    for (const [key, value] of Object.entries(initialStates)) {
      states[key] = {
        status: value.status as CheckStatus,
        notes: value.notes,
        internalNote: value.internalNote || "",
        source: (value.source as "manual" | "scan" | "ai") || "manual",
      };
    }
    return states;
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CHECKLIST.map((c) => c.id))
  );
  const [auditNotes, setAuditNotes] = useState(initialAuditNotes);
  const [auditNotesOpen, setAuditNotesOpen] = useState(!!initialAuditNotes.trim());
  const auditNotesTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [guideKey, setGuideKey] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [scanUrl, setScanUrl] = useState(siteUrl || "");
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Scanning...");

  useEffect(() => {
    if (!scanning) return;
    const messages = [
      "Analyzing page...",
      "Checking scripts and embeds...",
      "Scanning for forms...",
      "Reviewing consent setup...",
      "Checking cookie configuration...",
      "Verifying tag management...",
      "Wrapping up...",
    ];
    let index = 0;
    setScanStatus(messages[0]);
    const interval = setInterval(() => {
      index = Math.min(index + 1, messages.length - 1);
      setScanStatus(messages[index]);
    }, 3000);
    return () => clearInterval(interval);
  }, [scanning]);

  const [runningChecks, setRunningChecks] = useState<Set<string>>(new Set());
  const [scanResult, setScanResult] = useState<ScanResult | null>(() => {
    if (!initialScanRuns?.length) return null;
    const completedRuns = initialScanRuns.filter((r) => r.status === "completed");
    if (completedRuns.length === 0) return null;
    const allChecks: CheckResult[] = [];
    const seenKeys = new Set<string>();
    for (const run of completedRuns) {
      const findings = JSON.parse(run.findings) as CheckResult[];
      for (const check of findings) {
        if (!seenKeys.has(check.checkKey)) {
          seenKeys.add(check.checkKey);
          allChecks.push({
            checkKey: check.checkKey,
            status: check.status,
            summary: check.summary,
            findings: check.findings ?? [],
          });
        }
      }
    }
    return allChecks.length > 0
      ? { url: completedRuns[0].url, scannedAt: completedRuns[0].startedAt.toString(), checks: allChecks }
      : null;
  });
  const [lastScanType, setLastScanType] = useState<string | null>(null);
  const [scanDrawerOpen, setScanDrawerOpen] = useState(false);
  const [scanDrawerCheckKey, setScanDrawerCheckKey] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"scan" | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [fixAvailability, setFixAvailability] = useState<Record<string, FixAvailability>>({});
  const [fixingChecks, setFixingChecks] = useState<Set<string>>(new Set());
  const [lastSkippedCount, setLastSkippedCount] = useState(0);
  const [fixConfirm, setFixConfirm] = useState<{ checkKey: string; warning: string; label: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FixAnalysisResult | null>(null);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    getFixAvailability().then(setFixAvailability).catch(() => {});
  }, []);

  const openGuide = (key: string) => {
    setGuideKey(key);
    setGuideOpen(true);
  };

  const getCheckState = (key: string): CheckEntry =>
    checkStates[key] ?? { status: "not_checked" as CheckStatus, notes: "", internalNote: "", source: "manual" as const };

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
      const current = prev[key] ?? { status: "not_checked" as CheckStatus, notes: "", internalNote: "", source: "manual" as const };
      const updated = { ...current, [field]: value, source: "manual" as const };
      if (updated.status === "not_checked" && !updated.notes.trim() && !updated.internalNote.trim()) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: updated };
    });

    const current = checkStates[key] ?? { status: "not_checked" as CheckStatus, notes: "", internalNote: "", source: "manual" as const };
    const updated = { ...current, [field]: value };
    persistCheck(key, updated.status as CheckStatus, updated.notes, "manual");
  };

  const updateInternalNote = (key: string, value: string) => {
    setCheckStates((prev) => {
      const current = prev[key] ?? { status: "not_checked" as CheckStatus, notes: "", internalNote: "", source: "manual" as const };
      return { ...prev, [key]: { ...current, internalNote: value } };
    });

    if (!auditId) return;
    if (saveTimers.current[`internal-${key}`]) {
      clearTimeout(saveTimers.current[`internal-${key}`]);
    }
    saveTimers.current[`internal-${key}`] = setTimeout(() => {
      saveInternalNote(auditId, key, value).catch((err) => {
        addError("save", `Failed to save internal note for ${key}`, err instanceof Error ? err.message : "Unknown error");
      });
    }, 500);
  };

  const applyCheckResults = (results: CheckResult[], source: "scan" | "ai"): number => {
    let skipped = 0;
    const hasClientManaged = results.some((r) => r.status === "client_managed");

    setCheckStates((prev) => {
      const next = { ...prev };
      for (const check of results) {
        const existing = prev[check.checkKey];
        if (existing?.source === "manual" && existing.status !== "not_checked") {
          skipped++;
          continue;
        }
        if (source === "ai" && existing?.status === "client_managed") {
          skipped++;
          continue;
        }
        if (source === "ai" && check.status === "na" && existing?.source === "scan" && existing.status !== "not_checked") {
          skipped++;
          continue;
        }
        let status = check.status as CheckStatus;
        if (source === "ai" && existing?.source === "scan" && existing.status === "issue" && status !== "issue") {
          status = "issue";
        }
        const existingInternalNote = prev[check.checkKey]?.internalNote || "";
        next[check.checkKey] = { status, notes: "", internalNote: existingInternalNote, source };
        persistCheck(check.checkKey, status, "", source);
      }

      if (hasClientManaged) {
        for (const key of CLIENT_CONSENT_CHECKS) {
          const existing = prev[key];
          if (existing?.source === "manual" && existing.status !== "not_checked") continue;
          if (existing?.status === "ok" || existing?.status === "issue") continue;
          const existingInternalNote = prev[key]?.internalNote || "";
          next[key] = { status: "client_managed", notes: "", internalNote: existingInternalNote, source };
          persistCheck(key, "client_managed", "", source);
        }
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
        if (!updated) return c;
        if (source === "ai" && c.status === "client_managed") return c;
        if (source === "ai" && updated.status === "na" && c.status !== "na") return c;
        if (source === "ai" && c.findings.length > 0) {
          const mergedStatus = (c.status === "issue" || updated.status === "issue") ? "issue" as const : updated.status;
          return { ...updated, status: mergedStatus, findings: [...c.findings, ...updated.findings] };
        }
        return updated;
      });
      let allChecks = [...updatedChecks, ...newChecks];
      if (hasClientManaged) {
        const clientKeys = new Set(CLIENT_CONSENT_CHECKS);
        allChecks = allChecks.map((c) =>
          clientKeys.has(c.checkKey) && c.status !== "ok" && c.status !== "issue"
            ? { ...c, status: "client_managed" as const }
            : c
        );
      }
      return {
        url: scanUrl,
        scannedAt: new Date().toISOString(),
        checks: allChecks,
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

  const filteredChecklist = (() => {
    let list = auditType === "basic"
      ? CHECKLIST.map((cat) => ({ ...cat, checks: cat.checks.filter((c) => c.tier === "basic") }))
      : CHECKLIST;

    if (!showAllChecks && coverageType !== "unknown") {
      list = list.map((cat) => ({
        ...cat,
        checks: cat.checks.filter((c) => essentialChecks.has(c.key)),
      }));
    }

    return list.filter((cat) => cat.checks.length > 0);
  })();

  const hiddenCheckCount = (() => {
    if (showAllChecks || coverageType === "unknown") return 0;
    const tierList = auditType === "basic"
      ? CHECKLIST.flatMap((cat) => cat.checks.filter((c) => c.tier === "basic"))
      : CHECKLIST.flatMap((cat) => cat.checks);
    return tierList.filter((c) => !essentialChecks.has(c.key)).length;
  })();

  const getCategoryStats = (categoryId: string) => {
    const category = filteredChecklist.find((c) => c.id === categoryId);
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

  const hasExistingResults = Object.entries(checkStates).some(
    ([, s]) => s.status !== "not_checked"
  );

  const executeScan = async () => {
    setScanning(true);
    clearErrors();
    let totalSkipped = 0;
    const collectedResults: CheckResult[] = [];
    try {
      const result = await runPageScan(scanUrl, siteId);
      if (!result.error) {
        setLastScanType("page-scan");
        totalSkipped += applyCheckResults(result.checks, "scan");
        collectedResults.push(...result.checks);
        if (result.pagesScanned) {
          setScanResult((prev) => prev ? { ...prev, pagesScanned: result.pagesScanned } : prev);
        }
        const failedChecks = result.checks.filter((c) => c.status === "na" && c.findings.some((f) => f.severity === "warning"));
        for (const check of failedChecks) {
          addError("scan", `Check ${check.checkKey} failed`, check.summary);
        }
        if (auditId) {
          const run = await saveScanRun(auditId, "page-scan", scanUrl, result.checks);
          setScanRuns((prev) => [run, ...prev]);
        }

        if (result.detectedCookiebotId || result.detectedGtmId) {
          setSiteFields((prev) => ({
            ...prev,
            cookiebotId: result.detectedCookiebotId || prev?.cookiebotId,
            gtmId: result.detectedGtmId || prev?.gtmId,
          }));
        }

        const cbid = result.detectedCookiebotId || siteFields?.cookiebotId;
        if (cbid) {
          setScanStatus("Checking Cookiebot...");
          try {
            const cbResults = await runCookiebotScan(cbid, scanUrl);
            totalSkipped += applyCheckResults(cbResults, "scan");
            collectedResults.push(...cbResults);
            if (auditId) {
              const cbRun = await saveScanRun(auditId, "cookiebot", scanUrl, cbResults);
              setScanRuns((prev) => [cbRun, ...prev]);
            }
          } catch (err) {
            addError("scan", "Cookiebot scan failed", err instanceof Error ? err.message : "Unknown error");
          }
        }

        const gtmId = result.detectedGtmId || siteFields?.gtmId;
        if (gtmId) {
          setScanStatus("Checking GTM (may take a minute)...");
          try {
            const gtmResults = await runGtmScan(gtmId);
            totalSkipped += applyCheckResults(gtmResults, "scan");
            collectedResults.push(...gtmResults);
            if (auditId) {
              const gtmRun = await saveScanRun(auditId, "gtm-api", scanUrl, gtmResults);
              setScanRuns((prev) => [gtmRun, ...prev]);
            }
          } catch (err) {
            addError("scan", "GTM scan failed", err instanceof Error ? err.message : "Unknown error");
          }
        }
      } else {
        addError("scan", `Page scan failed: ${result.error}`, scanUrl);
        if (auditId) {
          const run = await saveScanRun(auditId, "page-scan", scanUrl, [], result.error);
          setScanRuns((prev) => [run, ...prev]);
        }
      }
    } catch (err) {
      addError("scan", "Page scan crashed", err instanceof Error ? err.message : "Unknown error");
    }

    setScanStatus("Running AI analysis...");
    try {
      const credits = await checkOpenRouterCredits();
      if (credits.available) {
        const aiResults = await runAllAIChecks(scanUrl, collectedResults);
        totalSkipped += applyCheckResults(aiResults, "ai");
        const failedAI = aiResults.filter((c) => c.status === "na" && c.findings.some((f) => f.severity === "warning"));
        for (const check of failedAI) {
          addError("ai", `AI check ${check.checkKey} failed`, check.summary);
        }
        if (auditId) {
          const run = await saveScanRun(auditId, "ai-agent", scanUrl, aiResults);
          setScanRuns((prev) => [run, ...prev]);
        }
      } else {
        addError("ai", "AI checks skipped", credits.error || "No OpenRouter credits available");
      }
    } catch (err) {
      addError("ai", "AI analysis failed", err instanceof Error ? err.message : "Unknown error");
    }

    setLastSkippedCount(totalSkipped);
    setScanning(false);
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

  const handleConfirm = () => {
    executeScan();
    setConfirmAction(null);
  };

  const handleApplyFix = async (checkKey: string) => {
    const fa = fixAvailability[checkKey];
    if (fa?.fix.safetyLevel === "confirm" && fa.fix.warning) {
      setFixConfirm({ checkKey, warning: fa.fix.warning, label: fa.fix.label });
      return;
    }
    await executeApplyFix(checkKey);
  };

  const executeApplyFix = async (checkKey: string) => {
    setFixingChecks((prev) => new Set(prev).add(checkKey));
    try {
      const result = await applyFix(checkKey, siteFields?.webflowId, siteFields?.gtmId);
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

  const handleAnalyzeFix = async (checkKey: string) => {
    setFixingChecks((prev) => new Set(prev).add(checkKey));
    try {
      const result = await analyzeFix(checkKey, siteFields?.webflowId, siteFields?.gtmId);
      setAnalysisResult(result);
      setScanDrawerCheckKey(checkKey);
      setScanDrawerOpen(true);
    } catch (err) {
      addError("fix", `Analysis for ${checkKey} failed`, err instanceof Error ? err.message : "Unknown error");
    } finally {
      setFixingChecks((prev) => {
        const next = new Set(prev);
        next.delete(checkKey);
        return next;
      });
    }
  };

  const handleConfirmFix = async () => {
    if (!fixConfirm) return;
    setFixConfirm(null);
    await executeApplyFix(fixConfirm.checkKey);
  };

  const handleRunCheck = async (checkKey: string, automation: string) => {
    if (!scanUrl.trim()) return;

    if (automation === "ai-agent") {
      const credits = await checkOpenRouterCredits();
      if (!credits.available) {
        addError("ai", "Can't run AI check", credits.error || "No OpenRouter credits available");
        return;
      }
    }

    setRunningChecks((prev) => new Set(prev).add(checkKey));
    try {
      if (automation === "cookiebot-api") {
        const cbid = siteFields?.cookiebotId;
        if (!cbid) {
          applyCheckResults([{
            checkKey,
            status: "blocked",
            findings: [{ element: "", detail: "Requires Cookiebot ID to run this check", severity: "info" }],
            summary: "Needs Cookiebot ID",
          }], "scan");
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
          if (result.detectedCookiebotId || result.detectedGtmId) {
            setSiteFields((prev) => ({
              ...prev,
              cookiebotId: result.detectedCookiebotId || prev?.cookiebotId,
              gtmId: result.detectedGtmId || prev?.gtmId,
            }));
          }
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

  const visibleCheckKeys = new Set(filteredChecklist.flatMap((c) => c.checks.map((ch) => ch.key)));
  const basicCheckKeys = new Set(CHECKLIST.flatMap((c) => c.checks.filter((ch) => ch.tier === "basic").map((ch) => ch.key)));
  const checkAutomation = new Map(filteredChecklist.flatMap((c) => c.checks.map((ch) => [ch.key, ch.automation] as const)));
  const visibleStates = Object.entries(checkStates).filter(([key]) => visibleCheckKeys.has(key));
  const totalChecks = visibleCheckKeys.size;
  const totalChecked = visibleStates.filter(([, s]) => s.status !== "not_checked").length;
  const totalIssues = visibleStates.filter(([, s]) => s.status === "issue").length;
  const basicIssues = visibleStates.filter(([key, s]) => s.status === "issue" && basicCheckKeys.has(key)).length;
  const fullIssues = visibleStates.filter(([key, s]) => s.status === "issue" && !basicCheckKeys.has(key)).length;
  const totalOk = visibleStates.filter(([, s]) => s.status === "ok").length;
  const totalNa = visibleStates.filter(([, s]) => s.status === "na").length;
  const totalNotChecked = totalChecks - totalChecked;
  const totalBlocked = visibleStates.filter(([key, s]) => {
    if (s.status === "blocked") return true;
    if (s.status !== "not_checked") return false;
    const reqs = CHECK_REQUIREMENTS[key];
    if (!reqs || reqs.length === 0) return false;
    return reqs.some((r) => !siteFields?.[r.field]);
  }).length;
  const totalClientManaged = visibleStates.filter(([, s]) => s.status === "client_managed").length;
  const totalWithComments = visibleStates.filter(([, s]) => s.notes.trim()).length;
  const totalWithInternalNotes = visibleStates.filter(([, s]) => s.internalNote.trim()).length;

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  const matchesFilter = (key: string): boolean => {
    if (activeFilters.size === 0) return true;
    const state = getCheckState(key);
    const statusFilters: string[] = [];
    const autoFilters: string[] = [];
    for (const filter of activeFilters) {
      if (filter.startsWith("auto:")) autoFilters.push(filter.slice(5));
      else statusFilters.push(filter);
    }
    const matchesStatus = statusFilters.length === 0 || statusFilters.some((f) => {
      if (f === "has_comments") return state.notes.trim().length > 0;
      if (f === "has_internal_note") return state.internalNote.trim().length > 0;
      if (f === "blocked") {
        if (state.status === "blocked") return true;
        if (state.status !== "not_checked") return false;
        const reqs = CHECK_REQUIREMENTS[key];
        if (!reqs || reqs.length === 0) return false;
        return reqs.some((r) => !siteFields?.[r.field]);
      }
      if (f === "client_managed") return state.status === "client_managed";
      return f === state.status;
    });
    const matchesAuto = autoFilters.length === 0 || autoFilters.includes(checkAutomation.get(key) || "");
    return matchesStatus && matchesAuto;
  };

  const scannedCheckCount = scanResult?.checks.length ?? 0;
  const scanIssueCount = scanResult?.checks.filter((c) => c.status === "issue").length ?? 0;
  const scanBasicIssues = scanResult?.checks.filter((c) => c.status === "issue" && basicCheckKeys.has(c.checkKey)).length ?? 0;
  const scanFullIssues = scanResult?.checks.filter((c) => c.status === "issue" && !basicCheckKeys.has(c.checkKey)).length ?? 0;
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
              {scanning ? scanStatus : "Scan site"}
            </Button>
          </div>
          {scanResult && !scanResult.error && (
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>Scanned: {scanResult.url}</span>
              <span>{scannedCheckCount} checks run</span>
              {scanBasicIssues > 0 && (
                <Badge variant="destructive" className="text-xs">{scanBasicIssues} basic issue{scanBasicIssues !== 1 ? "s" : ""}</Badge>
              )}
              {scanFullIssues > 0 && (
                <Badge variant="destructive" className="text-xs ">{scanFullIssues} full issue{scanFullIssues !== 1 ? "s" : ""}</Badge>
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
              {scanResult?.pagesScanned && scanResult.pagesScanned > 1 && (
                <span className="text-muted-foreground">{scanResult.pagesScanned} pages scanned</span>
              )}
            </div>
          )}
          {urlError && (
            <div className="flex items-center gap-1.5 mt-3">
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              <p className="text-xs text-destructive">{urlError}</p>
            </div>
          )}
          {scanResult?.error && (
            <p className="mt-3 text-xs text-destructive">Scan failed: {scanResult.error}</p>
          )}
        </CardContent>
      </Card>

      {scanRuns.length > 0 && (
        <div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-3.5 w-3.5" />
              {scanRuns.length} scan run{scanRuns.length !== 1 ? "s" : ""}
              {showHistory ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {showHistory && scanRuns.length > 1 && (
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                onClick={async () => {
                  if (!auditId) return;
                  await deleteAllScanRuns(auditId);
                  setScanRuns([]);
                  setShowHistory(false);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>
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
                      {run.scanType === "page-scan" ? "Scan" : run.scanType === "cookiebot" ? "Cookiebot" : "AI"}
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
                    <button
                      className="ml-auto text-muted-foreground hover:text-destructive shrink-0"
                      onClick={async () => {
                        await deleteScanRun(run.id);
                        setScanRuns((prev) => prev.filter((r) => r.id !== run.id));
                      }}
                      aria-label="Delete scan run"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ChecklistLegend />

      {auditId && (
        <div className="text-sm">
          <button
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setAuditNotesOpen(!auditNotesOpen)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Auditor notes
            {auditNotes.trim() && <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />}
            {auditNotesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {auditNotesOpen && (
            <div className="mt-2">
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                placeholder="General notes about this audit - observations, patterns, client communication, things to follow up on. Not included in the client report."
                value={auditNotes}
                onChange={(e) => {
                  setAuditNotes(e.target.value);
                  if (auditNotesTimer.current) clearTimeout(auditNotesTimer.current);
                  auditNotesTimer.current = setTimeout(() => {
                    if (auditId) saveAuditNotes(auditId, e.target.value);
                  }, 800);
                }}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Internal only - not included in client reports. Auto-saves.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button
          onClick={async () => {
            const next = auditType === "basic" ? "full" : "basic";
            setAuditType(next);
            if (auditId) await updateAuditType(auditId, next);
          }}
          title="Click to switch between Basic and Full audit"
        >
          <Badge variant="secondary" className={`text-[10px] cursor-pointer hover:ring-1 hover:ring-ring ${auditType === "basic" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" : "bg-purple-500/15 text-purple-600 dark:text-purple-400"}`}>
            {auditType === "basic" ? "Basic" : "Full"} ({filteredChecklist.reduce((s, c) => s + c.checks.length, 0)} checks)
          </Badge>
        </button>
        {coverageType !== "unknown" && (
          <button
            onClick={() => setShowAllChecks(!showAllChecks)}
            title={showAllChecks ? "Show only essential checks for this coverage type" : "Show all checks"}
          >
            <Badge variant="secondary" className="text-[10px] cursor-pointer hover:ring-1 hover:ring-ring">
              {showAllChecks
                ? `Showing all - click to filter for ${COVERAGE_TYPES[coverageType].label}`
                : `${COVERAGE_TYPES[coverageType].label} essentials`}
              {hiddenCheckCount > 0 && !showAllChecks && ` (${hiddenCheckCount} hidden)`}
            </Badge>
          </button>
        )}
        {coverageType === "unknown" && (
          <span className="text-amber-600 dark:text-amber-400">Coverage type not set - showing all checks</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground text-xs mr-1">
          {totalChecked}/{totalChecks} checked
          {totalIssues > 0 && ` - ${totalIssues} issue${totalIssues !== 1 ? "s" : ""}`}
        </span>
        {(() => {
          const activeStatusFilter = Array.from(activeFilters).find((f) => !f.startsWith("auto:") && f !== "has_comments" && f !== "has_internal_note");
          const statusItems: { key: string; label: string; count: number }[] = [
            { key: "not_checked", label: "Not checked", count: totalNotChecked },
            { key: "ok", label: "OK", count: totalOk },
            { key: "issue", label: "Issues", count: totalIssues },
            { key: "blocked", label: "Blocked", count: totalBlocked },
            { key: "client_managed", label: "Client managed", count: totalClientManaged },
            { key: "na", label: "N/A", count: totalNa },
            { key: "has_comments", label: "Has comments", count: totalWithComments },
            { key: "has_internal_note", label: "Internal notes", count: totalWithInternalNotes },
          ].filter((s) => s.count > 0 || s.key === "issue");
          const activeLabel = statusItems.find((s) => activeFilters.has(s.key))?.label;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 outline-none">
                <Badge
                  variant="secondary"
                  className={`cursor-pointer text-xs gap-1 ${activeStatusFilter || activeFilters.has("has_comments") || activeFilters.has("has_internal_note") ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
                >
                  {activeLabel ?? "Status"}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setActiveFilters((prev) => {
                      const next = new Set(prev);
                      for (const s of statusItems) next.delete(s.key);
                      return next;
                    });
                  }}
                >
                  <Check className={`h-3.5 w-3.5 shrink-0 ${!activeStatusFilter && !activeFilters.has("has_comments") && !activeFilters.has("has_internal_note") ? "opacity-100" : "opacity-0"}`} />
                  <span>All</span>
                </DropdownMenuItem>
                {statusItems.map((item) => {
                  const isActive = activeFilters.has(item.key);
                  return (
                    <DropdownMenuItem
                      key={item.key}
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => {
                        setActiveFilters((prev) => {
                          const next = new Set(prev);
                          for (const s of statusItems) next.delete(s.key);
                          if (!isActive) next.add(item.key);
                          return next;
                        });
                      }}
                    >
                      <Check className={`h-3.5 w-3.5 shrink-0 ${isActive ? "opacity-100" : "opacity-0"}`} />
                      <span>{item.label}</span>
                      <span className="ml-auto text-muted-foreground text-xs">({item.count})</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })()}
        {(() => {
          const typeCounts = Array.from(checkAutomation.values()).reduce<Record<string, number>>((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});
          const activeAutoFilter = Array.from(activeFilters).find((f) => f.startsWith("auto:"));
          const activeLabel = activeAutoFilter
            ? AUTOMATION_CONFIG[activeAutoFilter.slice(5) as keyof typeof AUTOMATION_CONFIG]?.label
            : null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 outline-none">
                <Badge
                  variant="secondary"
                  className={`cursor-pointer text-xs gap-1 ${activeAutoFilter ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
                >
                  {activeLabel ?? "Check type"}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setActiveFilters((prev) => {
                      const next = new Set(prev);
                      for (const f of next) { if (f.startsWith("auto:")) next.delete(f); }
                      return next;
                    });
                  }}
                >
                  <Check className={`h-3.5 w-3.5 shrink-0 ${!activeAutoFilter ? "opacity-100" : "opacity-0"}`} />
                  <span>All</span>
                  <span className="ml-auto text-muted-foreground text-xs">({totalChecks})</span>
                </DropdownMenuItem>
                {Object.entries(typeCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const config = AUTOMATION_CONFIG[type as keyof typeof AUTOMATION_CONFIG];
                    if (!config) return null;
                    const filterKey = `auto:${type}`;
                    const isActive = activeAutoFilter === filterKey;
                    return (
                      <DropdownMenuItem
                        key={type}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                          setActiveFilters((prev) => {
                            const next = new Set(prev);
                            for (const f of next) { if (f.startsWith("auto:")) next.delete(f); }
                            if (!isActive) next.add(filterKey);
                            return next;
                          });
                        }}
                      >
                        <Check className={`h-3.5 w-3.5 shrink-0 ${isActive ? "opacity-100" : "opacity-0"}`} />
                        <span className={config.className.replace(/bg-\S+/g, "").trim()}>
                          {config.label}
                        </span>
                        <span className="ml-auto text-muted-foreground text-xs">({count})</span>
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })()}
        {activeFilters.size > 0 && (
          <button
            onClick={() => setActiveFilters(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </button>
        )}
        {errors.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 ml-auto">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.length} error{errors.length !== 1 ? "s" : ""} - see error log in Settings
          </span>
        )}
        {auditId && totalChecked > 0 && (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors ml-auto"
            onClick={() => setShowResetConfirm(true)}
          >
            <RotateCcw className="h-3 w-3" />
            Reset all checks
          </button>
        )}
      </div>

      {totalClientManaged > 0 && (
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <UserCircle className="h-5 w-5 text-cyan-500 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Client-managed consent setup detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This site has a GTM container that isn't in our Google account. This usually means the client manages their own consent and tracking setup.
                    {totalClientManaged} check{totalClientManaged !== 1 ? "s" : ""} can't be verified through our tools and {totalClientManaged !== 1 ? "have" : "has"} been marked as "Client managed?".
                  </p>
                </div>
                <div className="text-xs text-cyan-700 dark:text-cyan-400 space-y-1.5">
                  <p className="font-medium">How to verify this is actually client-managed:</p>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>Open the site in an incognito browser - does a consent banner appear? If yes, they have a consent setup running.</li>
                    <li>Check the banner - does it say Cookiebot, OneTrust, CookieYes, or another CMP? That tells you what they're using.</li>
                    <li>In DevTools Console, type <code className="bg-cyan-500/10 px-1 rounded">google_tag_manager</code> - if it returns an object, GTM is active.</li>
                    <li>Ask the client: "Do you manage your own cookie consent and GTM setup?" - if yes, these checks are their responsibility.</li>
                  </ul>
                  <p className="mt-1.5 text-muted-foreground">
                    If the client wants us to manage GTM, ask them to invite our Google account as a Reader in GTM (Admin &gt; User Management), then re-scan.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {coverageType === "no-sla" && scanResult && (() => {
        const trackingFindings = scanResult.checks.filter(
          (c) => c.checkKey === "A1" && c.status === "issue"
        );
        const hasTracking = trackingFindings.length > 0 || scanResult.checks.some(
          (c) => c.findings?.some((f) => /google.analytics|gtag|_ga|facebook|linkedin|pixel/i.test(f.detail || f.element || ""))
        );
        if (!hasTracking) return null;
        return (
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tracking scripts detected on a non-SLA site</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This site has tracking scripts (Google Analytics, pixels, etc.) but we don't manage their GDPR compliance.
                    Without proper consent management, these scripts may be collecting visitor data without consent.
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                    Consider reaching out to this client to suggest either an SLA for GDPR management,
                    or that they disable tracking until they have consent management in place.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {coverageType === "us-based" && (
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">
              US-based site - EU GDPR cookie consent rules do not apply.
              US privacy laws (CCPA, state laws) may apply depending on audience.
              Most cookie/consent checks are hidden. Switch to "Show all" above if needed.
            </p>
          </CardContent>
        </Card>
      )}

      {filteredChecklist.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const stats = getCategoryStats(category.id);

        const visibleChecks = activeFilters.size > 0
          ? category.checks.filter((c) => matchesFilter(c.key))
          : category.checks;

        if (activeFilters.size > 0 && visibleChecks.length === 0) return null;

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
                        safetyLevel: fa.fix.safetyLevel,
                        warning: fa.fix.warning,
                      }
                    : undefined;
                  return (
                    <CheckItem
                      key={check.key}
                      check={check}
                      status={state.status}
                      notes={state.notes}
                      internalNote={state.internalNote}
                      scanResult={scanCheck}
                      isRunning={runningChecks.has(check.key)}
                      isFixing={fixingChecks.has(check.key)}
                      siteFields={siteFields}
                      fixInfo={fixInfo}
                      onStatusChange={(s) => updateCheck(check.key, "status", s)}
                      onNotesChange={(n) => updateCheck(check.key, "notes", n)}
                      onInternalNoteChange={(n) => updateInternalNote(check.key, n)}
                      onOpenGuide={openGuide}
                      onViewScanDetails={scanCheck ? openScanDetails : undefined}
                      onRunCheck={(check.automation === "ai-agent" || check.automation === "page-scan" || check.automation === "cookiebot-api") ? (key) => handleRunCheck(key, check.automation) : undefined}
                      onApplyFix={handleApplyFix}
                      onAnalyzeFix={handleAnalyzeFix}
                    />
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}

      {activeFilters.size === 0 && (
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
        analysisResult={analysisResult}
        site={siteFields}
        open={scanDrawerOpen}
        onOpenChange={(open) => {
          setScanDrawerOpen(open);
          if (!open) setAnalysisResult(null);
        }}
        onVerifyGtm={verifyGtmSetup}
        onPushGtmSnippet={pushGtmSnippetToSite}
        onDeleteScript={deleteApiManagedScript}
        onRescan={() => {
          setScanDrawerOpen(false);
          executeScan();
        }}
        onSaveNote={(step, note) => {
          if (!auditId || !scanDrawerCheckKey) return;
          const current = checkStates[scanDrawerCheckKey];
          const existingNotes = current?.notes || "";
          const updatedNotes = existingNotes
            ? `${existingNotes}\n[Fix flow] ${step}: ${note}`
            : `[Fix flow] ${step}: ${note}`;
          updateCheck(scanDrawerCheckKey, "notes", updatedNotes);
        }}
      />

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-run all checks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite existing results. Manually reviewed checks will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all checks?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">This will clear all check results, notes, scan history, and snapshots for this audit. Site information (name, URL, IDs) will be kept.</span>
              <span className="block text-destructive font-medium">This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!auditId) return;
                const result = await resetAllChecks(auditId);
                if (result.success) {
                  setCheckStates({});
                  setScanResult(null);
                  setScanRuns([]);
                  setShowResetConfirm(false);
                }
              }}
            >
              Reset everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={fixConfirm !== null} onOpenChange={(open) => !open && setFixConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {fixConfirm?.label}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">{fixConfirm?.warning}</span>
              <span className="block text-amber-600 dark:text-amber-400 font-medium">
                This will modify external systems (GTM or Webflow). Make sure you understand what will change before continuing.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFix}>Apply fix</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
