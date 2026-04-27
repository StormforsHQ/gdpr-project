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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Check, CheckStatus, LegalReference } from "@/lib/checklist";
import type { CheckResult } from "@/lib/scanner";
import { STATUS_CONFIG, AUTOMATION_CONFIG } from "@/lib/checklist";
import { CHECK_REQUIREMENTS } from "@/lib/glossary";
import { GlossaryText } from "@/components/glossary-text";
import { CircleDashed, CheckCircle2, AlertCircle, MinusCircle, Info, FileSearch, Play, Loader2, Scale, Landmark, AlertTriangle } from "lucide-react";

const STATUS_ICONS: Record<CheckStatus, React.ReactNode> = {
  not_checked: <CircleDashed className="h-4 w-4 text-muted-foreground" />,
  ok: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  issue: <AlertCircle className="h-4 w-4 text-destructive" />,
  na: <MinusCircle className="h-4 w-4 text-muted-foreground" />,
};

interface CheckItemProps {
  check: Check;
  status: CheckStatus;
  notes: string;
  scanResult?: CheckResult;
  isRunning?: boolean;
  siteFields?: { cookiebotId?: string | null; gtmId?: string | null };
  onStatusChange: (status: CheckStatus) => void;
  onNotesChange: (notes: string) => void;
  onOpenGuide: (key: string) => void;
  onViewScanDetails?: (key: string) => void;
  onRunCheck?: (key: string) => void;
}

export function CheckItem({
  check,
  status,
  notes,
  scanResult,
  isRunning,
  siteFields,
  onStatusChange,
  onNotesChange,
  onOpenGuide,
  onViewScanDetails,
  onRunCheck,
}: CheckItemProps) {
  const [expanded, setExpanded] = useState(false);
  const automationInfo = AUTOMATION_CONFIG[check.automation];

  const requirements = CHECK_REQUIREMENTS[check.key] || [];
  const missingRequirements = siteFields
    ? requirements.filter((r) => !siteFields[r.field])
    : [];

  return (
    <div className="border-b last:border-b-0">
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {STATUS_ICONS[status]}
        <span className="text-xs font-mono text-muted-foreground w-7 shrink-0">
          {check.key}
        </span>
        <span className="text-sm flex-1">{check.label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 ${automationInfo.className}`}>
          {automationInfo.label}
        </span>
        {scanResult && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onViewScanDetails?.(check.key);
            }}
            aria-label={`Scan details for ${check.key}`}
          >
            <FileSearch className="h-4 w-4 text-primary" />
          </Button>
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
        <Badge
          variant={status === "issue" ? "destructive" : "secondary"}
          className="text-xs"
        >
          {STATUS_CONFIG[status].label}
        </Badge>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pl-14 space-y-3">
          <p className="text-xs text-muted-foreground">
            <GlossaryText text={check.description} />
          </p>
          {missingRequirements.length > 0 && (
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {missingRequirements.map((r) => r.reason).join(". ")}
              </p>
            </div>
          )}
          {check.legalBasis && (
            <div className="space-y-1.5">
              <div className="flex items-start gap-1.5">
                <Scale className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">{check.legalBasis}</p>
              </div>
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
            </div>
          )}
          {check.imyNote && (
            <div className="space-y-1.5">
              <div className="flex items-start gap-1.5">
                <Landmark className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  <span className="font-semibold">SE/IMY: </span>
                  {check.imyNote}
                </p>
              </div>
              {check.imyReferences && check.imyReferences.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 pl-[18px]">
                  {check.imyReferences.map((ref, i) => (
                    <a
                      key={i}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-500 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ref.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
          {scanResult && scanResult.findings.length > 0 && (
            <div className="space-y-1">
              {scanResult.findings.slice(0, 3).map((f, i) => (
                <p key={i} className={`text-xs ${f.severity === "error" ? "text-destructive" : f.severity === "warning" ? "text-amber-500" : "text-muted-foreground"}`}>
                  {f.detail}
                </p>
              ))}
              {scanResult.findings.length > 3 && (
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewScanDetails?.(check.key);
                  }}
                >
                  +{scanResult.findings.length - 3} more findings
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-3">
            {onRunCheck && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onRunCheck(check.key);
                }}
                disabled={isRunning || missingRequirements.length > 0}
                title={missingRequirements.length > 0 ? `Missing: ${missingRequirements.map((r) => r.label).join(", ")}` : undefined}
              >
                {isRunning ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                {isRunning ? "Running..." : status !== "not_checked" ? "Re-run" : "Run check"}
              </Button>
            )}
            <Select
              value={status}
              onValueChange={(v) => onStatusChange(v as CheckStatus)}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_checked">Not checked</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="na">N/A</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Notes..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="h-8 text-xs flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
