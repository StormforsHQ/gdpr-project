"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Check, CheckStatus, LegalReference } from "@/lib/checklist";
import type { CheckResult } from "@/lib/scanner";
import { AUTOMATION_CONFIG, RESPONSIBILITY_CONFIG } from "@/lib/checklist";
import { CHECK_REQUIREMENTS } from "@/lib/glossary";
import { GlossaryText } from "@/components/glossary-text";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleDashed, CheckCircle2, AlertCircle, MinusCircle, Info, Play, Loader2, Scale, Landmark, AlertTriangle, Wrench, Search, StickyNote, UserCircle } from "lucide-react";

const STATUS_ICONS: Record<CheckStatus, React.ReactNode> = {
  not_checked: <CircleDashed className="h-4 w-4 text-muted-foreground" />,
  ok: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  issue: <AlertCircle className="h-4 w-4 text-destructive" />,
  na: <MinusCircle className="h-4 w-4 text-muted-foreground" />,
  blocked: <CircleDashed className="h-4 w-4 text-amber-500" />,
  client_managed: <UserCircle className="h-4 w-4 text-cyan-500" />,
};

export interface FixInfo {
  label: string;
  description: string;
  ready: boolean;
  missingServices: string[];
  requires: string[];
  safetyLevel: "safe" | "confirm" | "guided";
  warning?: string;
}

interface CheckItemProps {
  check: Check;
  status: CheckStatus;
  notes: string;
  internalNote?: string;
  scanResult?: CheckResult;
  isRunning?: boolean;
  isFixing?: boolean;
  siteFields?: { cookiebotId?: string | null; gtmId?: string | null };
  fixInfo?: FixInfo;
  onStatusChange: (status: CheckStatus) => void;
  onNotesChange: (notes: string) => void;
  onInternalNoteChange?: (note: string) => void;
  onOpenGuide: (key: string) => void;
  onRunCheck?: (key: string) => void;
  onApplyFix?: (key: string) => void;
  onAnalyzeFix?: (key: string) => void;
}

export function CheckItem({
  check,
  status,
  notes,
  internalNote = "",
  scanResult,
  isRunning,
  siteFields,
  onStatusChange,
  onNotesChange,
  onInternalNoteChange,
  onOpenGuide,
  onRunCheck,
  fixInfo,
  isFixing,
  onApplyFix,
  onAnalyzeFix,
}: CheckItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [reportNoteOpen, setReportNoteOpen] = useState(!!notes.trim());
  const [internalNoteOpen, setInternalNoteOpen] = useState(!!internalNote.trim());
  const [legalOpen, setLegalOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const fellBackToBrowser = scanResult?.status === "blocked" && /check in browser/i.test(scanResult.summary || "");
  const automationInfo = fellBackToBrowser ? AUTOMATION_CONFIG["browser-manual"] : AUTOMATION_CONFIG[check.automation];

  const requirements = CHECK_REQUIREMENTS[check.key] || [];
  const missingRequirements = siteFields
    ? requirements.filter((r) => !siteFields[r.field])
    : [];
  const isBlockedByRequirement = missingRequirements.length > 0 && status === "not_checked";

  return (
    <div className="border-b last:border-b-0">
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {isBlockedByRequirement
          ? <CircleDashed className="h-4 w-4 text-amber-500" />
          : STATUS_ICONS[status]}
        <span className="text-xs font-mono text-muted-foreground w-7 shrink-0">
          {check.key}
        </span>
        {internalNote.trim() && (
          <Tooltip>
            <TooltipTrigger>
              <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs text-black dark:text-black">
              <p className="font-medium">Internal note</p>
              <p className="opacity-60 mt-0.5 line-clamp-2">{internalNote}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <span className="text-sm flex-1">{check.label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 ${automationInfo.className}`}>
          {automationInfo.label}
        </span>
        {check.responsibility && check.responsibility !== "agency" && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 ${RESPONSIBILITY_CONFIG[check.responsibility].className}`}>
            {RESPONSIBILITY_CONFIG[check.responsibility].label}
          </span>
        )}
        {isBlockedByRequirement && (
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs text-black dark:text-black">
              Blocked - {missingRequirements.map((r) => r.label).join(" and ")} not set. Click to expand for details.
            </TooltipContent>
          </Tooltip>
        )}
        {!isBlockedByRequirement && !fellBackToBrowser && status === "blocked" && scanResult && (
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs text-black dark:text-black">
              {scanResult.summary}
            </TooltipContent>
          </Tooltip>
        )}
        {status === "client_managed" && (
          <Tooltip>
            <TooltipTrigger>
              <UserCircle className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs text-black dark:text-black">
              Likely managed by the client. Click to expand for details.
            </TooltipContent>
          </Tooltip>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onOpenGuide(check.key);
          }}
          aria-label={`Guide for ${check.key}`}
        >
          <Info className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pl-14 space-y-3">
          <p className="text-xs text-muted-foreground">
            <GlossaryText text={check.description} />
          </p>
          {isBlockedByRequirement && (
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {missingRequirements[0].reason}
              </p>
            </div>
          )}
          {status === "blocked" && scanResult && !fellBackToBrowser && (
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {scanResult.summary}
              </p>
            </div>
          )}
          {fellBackToBrowser && scanResult && (
            <div className="flex items-start gap-1.5 p-2.5 rounded-md bg-blue-500/10 border border-blue-500/20">
              <Info className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-400">
                <p className="font-medium mb-0.5">Verify in browser</p>
                <p>{scanResult.summary}</p>
              </div>
            </div>
          )}
          {status === "client_managed" && (
            <div className="flex items-start gap-1.5 p-2.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
              <UserCircle className="h-3 w-3 text-cyan-500 mt-0.5 shrink-0" />
              <div className="text-xs text-cyan-700 dark:text-cyan-400">
                <p className="font-medium mb-0.5">Likely managed by the client</p>
                <p>The GTM container on this site isn't in our Google account, which usually means the client manages their own consent and tag setup. These checks need access to the GTM container to run.</p>
                {scanResult && scanResult.findings.length > 0 && (
                  <p className="mt-1.5 whitespace-pre-line">{scanResult.findings[0].detail}</p>
                )}
              </div>
            </div>
          )}
          {status === "not_checked" && !isBlockedByRequirement && check.manualHint && (
            <div className="flex items-start gap-1.5 p-2.5 rounded-md bg-muted/50 border border-border">
              <Info className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-0.5 text-foreground">How to check this manually</p>
                <p>{check.manualHint}</p>
              </div>
            </div>
          )}
          {(check.legalBasis || check.imyNote) && (
            <div className="space-y-1.5">
              <button
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); setLegalOpen(!legalOpen); }}
              >
                <Scale className="h-3 w-3 shrink-0" />
                <span className="font-medium">Legal</span>
              </button>
              {legalOpen && (
                <>
                  {check.legalBasis && (
                    <p className="text-xs text-muted-foreground pl-[18px]">{check.legalBasis}</p>
                  )}
                  {check.references && check.references.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pl-[18px]">
                      {check.references.map((ref, i) => (
                        <a
                          key={i}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ref.label}
                        </a>
                      ))}
                    </div>
                  )}
                  {check.imyNote && (
                    <div className="flex items-start gap-1.5 pl-[18px] pt-1">
                      <Landmark className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">SE/IMY: </span>
                        {check.imyNote}
                      </p>
                    </div>
                  )}
                  {check.imyReferences && check.imyReferences.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pl-[18px]">
                      {check.imyReferences.map((ref, i) => (
                        <a
                          key={i}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ref.label}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {scanResult && (
            <div className="space-y-1.5">
              <button
                className={`flex items-center gap-1.5 text-xs transition-colors ${scanResult.status === "issue" ? "text-destructive hover:text-destructive/80" : "text-muted-foreground hover:text-foreground"}`}
                onClick={(e) => { e.stopPropagation(); setIssuesOpen(!issuesOpen); }}
              >
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span className="font-medium">Issues ({scanResult.findings.filter((f) => f.severity === "error").length})</span>
              </button>
              {issuesOpen && (
                <>
                  <p className="text-xs pl-[18px] text-muted-foreground">
                    {scanResult.summary}
                  </p>
                  {scanResult.status === "issue" && scanResult.findings.filter((f) => f.severity === "error").length > 0 && (
                    <ul className="space-y-1 pl-[18px]">
                      {scanResult.findings.filter((f) => f.severity === "error").map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className="shrink-0">-</span>
                          <span>
                            {f.element && f.element !== "page" && <span className="font-medium">{f.element}: </span>}
                            {f.detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
          <div className="flex items-center gap-3">
            {onRunCheck && (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunCheck(check.key);
                    }}
                    disabled={isRunning || missingRequirements.length > 0}
                  >
                    {isRunning ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    {isRunning ? "Running..." : status !== "not_checked" ? "Re-run" : "Run check"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs text-black dark:text-black">
                  {missingRequirements.length > 0
                    ? `Missing: ${missingRequirements.map((r) => r.label).join(", ")}`
                    : status !== "not_checked"
                      ? "Run this check again with fresh data"
                      : "Run this automated check"}
                </TooltipContent>
              </Tooltip>
            )}
            {fixInfo && status === "issue" && fixInfo.safetyLevel === "guided" && !scanResult && (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant={fixInfo.ready ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fixInfo.ready && onAnalyzeFix) onAnalyzeFix(check.key);
                    }}
                    disabled={!fixInfo.ready || isFixing}
                  >
                    {isFixing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Search className="h-3 w-3" />
                    )}
                    {isFixing ? "Analyzing..." : "Analyze"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs text-black dark:text-black">
                  <div>
                    <p className="font-medium">{fixInfo.label}</p>
                    <p className="opacity-60 mt-0.5">{fixInfo.description}</p>
                    {fixInfo.warning && (
                      <p className="text-amber-700 mt-1">{fixInfo.warning}</p>
                    )}
                    {!fixInfo.ready && (
                      <p className="text-amber-700 mt-1">
                        Needs: {fixInfo.missingServices.join(", ")}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            {fixInfo && status === "issue" && fixInfo.safetyLevel !== "guided" && (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant={fixInfo.ready ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fixInfo.ready && onApplyFix) onApplyFix(check.key);
                    }}
                    disabled={!fixInfo.ready || isFixing}
                  >
                    {isFixing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wrench className="h-3 w-3" />
                    )}
                    {isFixing ? "Fixing..." : "Fix this"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs text-black dark:text-black">
                  <div>
                    <p className="font-medium">{fixInfo.label}</p>
                    <p className="opacity-60 mt-0.5">{fixInfo.description}</p>
                    {fixInfo.warning && (
                      <p className="text-amber-700 mt-1">{fixInfo.warning}</p>
                    )}
                    {!fixInfo.ready && (
                      <p className="text-amber-700 mt-1">
                        Needs: {fixInfo.missingServices.join(", ")}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            <Select
              value={status}
              onValueChange={(v) => onStatusChange(v as CheckStatus)}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="Not checked">
                  {{ not_checked: "Not checked", ok: "OK", issue: "Issue", na: "N/A", blocked: "Blocked", client_managed: "Client managed?" }[status] ?? status}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_checked">Not checked</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="na">N/A</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="client_managed">Client managed?</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div>
              <button
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setReportNoteOpen(!reportNoteOpen);
                }}
              >
                <StickyNote className="h-3 w-3" />
                {reportNoteOpen ? "Hide note" : notes.trim() ? "Edit report note" : "Add report note"}
                <span className="opacity-60">(included in client report)</span>
              </button>
              {reportNoteOpen && (
                <textarea
                  placeholder="Note for this check - will be shown in the client report appendix."
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 resize-y min-h-[2rem]"
                />
              )}
            </div>
            {onInternalNoteChange && (
              <div>
                <button
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInternalNoteOpen(!internalNoteOpen);
                  }}
                >
                  <StickyNote className="h-3 w-3" />
                  {internalNoteOpen ? "Hide note" : internalNote.trim() ? "Edit internal note" : "Add internal note"}
                  <span className="opacity-60">(not included in client report)</span>
                </button>
                {internalNoteOpen && (
                  <textarea
                    placeholder="Private note - for reminders, things to double-check, or questions for the team."
                    value={internalNote}
                    onChange={(e) => onInternalNoteChange(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 resize-y min-h-[2rem]"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
