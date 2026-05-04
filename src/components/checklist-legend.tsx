"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, HelpCircle, CircleDashed, CheckCircle2, AlertCircle, MinusCircle, Info, FileSearch, Scan, Sparkles } from "lucide-react";

export function ChecklistLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-sm">
      <button
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        How this page works
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 text-xs text-muted-foreground">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Scan buttons</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Scan className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p><span className="text-foreground">Scan site button</span> - Fetches the page HTML and runs automated checks: script setup, cookie detection, form structure, meta tags. Also runs Cookiebot API checks if a Cookiebot ID is configured.</p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p><span className="text-foreground">AI Analyze button</span> - Sends page content to an LLM to evaluate things automated scanning can't catch: consent language, dark patterns, privacy policy completeness, data minimization. Uses OpenRouter credits.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Status icons</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <CircleDashed className="h-4 w-4 text-muted-foreground shrink-0" />
                <p>Not checked yet</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <p>OK - no issues found</p>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p>Issue found - needs attention</p>
              </div>
              <div className="flex items-center gap-2">
                <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                <p>N/A - not applicable to this site</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Check type badges</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-green-500/15 text-green-600 dark:text-green-400 mt-0.5">Auto</span>
                <p>Runs automatically with the Scan site button. Analyzes page HTML directly.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 mt-0.5">Cookiebot</span>
                <p>Runs automatically with the Scan site button if a Cookiebot ID is set. Queries the Cookiebot API.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 mt-0.5">GTM API</span>
                <p>Run individually per check using the Run check button. Queries the Google Tag Manager API. Requires a GTM container ID on the site.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-purple-500/15 text-purple-600 dark:text-purple-400 mt-0.5">AI</span>
                <p>Runs automatically with the AI Analyze button. An LLM reviews the page content and evaluates compliance. Uses OpenRouter credits.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-muted text-muted-foreground mt-0.5">Manual</span>
                <p>Requires a human to review. Cannot be automated.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Row icons</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-primary shrink-0" />
                <p>View scan results - shows detailed findings from the last scan or AI analysis for this check.</p>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                <p>Check guide - explains what this check looks for, how to verify it, and how to fix issues.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
