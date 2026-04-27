"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CHECK_GUIDES } from "@/lib/check-guides";
import { CHECKLIST } from "@/lib/checklist";
import { Wrench, Lightbulb, Scale, Landmark } from "lucide-react";

interface CheckGuideDrawerProps {
  checkKey: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckGuideDrawer({
  checkKey,
  open,
  onOpenChange,
}: CheckGuideDrawerProps) {
  const guide = checkKey ? CHECK_GUIDES[checkKey] : null;
  const check = checkKey
    ? CHECKLIST.flatMap((c) => c.checks).find((c) => c.key === checkKey)
    : null;

  if (!guide) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              {guide.key}
            </Badge>
            <SheetTitle className="text-base">{guide.title}</SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="px-6 py-5 space-y-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Why this matters
              </h3>
              <p className="text-sm leading-relaxed">{guide.why}</p>
            </div>

            {check?.legalBasis && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Scale className="h-3 w-3" />
                    Legal basis
                  </h3>
                  <p className="text-sm leading-relaxed text-amber-600 dark:text-amber-400">
                    {check.legalBasis}
                  </p>
                  {check.references && check.references.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {check.references.map((ref, i) => (
                        <li key={i}>
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {ref.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}

            {check?.imyNote && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Landmark className="h-3 w-3" />
                    Sweden / IMY
                  </h3>
                  <p className="text-sm leading-relaxed text-blue-600 dark:text-blue-400">
                    {check.imyNote}
                  </p>
                  {check.imyReferences && check.imyReferences.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {check.imyReferences.map((ref, i) => (
                        <li key={i}>
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            {ref.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}

            <Separator />

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Step-by-step
              </h3>
              <ol className="space-y-2">
                {guide.steps.map((step, i) => {
                  const isSubStep = step.startsWith("  -");
                  if (isSubStep) {
                    return (
                      <li key={i} className="text-sm leading-relaxed pl-8 text-muted-foreground">
                        {step.trim().replace(/^- /, "")}
                      </li>
                    );
                  }
                  return (
                    <li key={i} className="text-sm leading-relaxed flex gap-3">
                      <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">
                        {i + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {guide.tools && guide.tools.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Wrench className="h-3 w-3" />
                    Tools
                  </h3>
                  <ul className="space-y-1">
                    {guide.tools.map((tool, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {guide.tips && guide.tips.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3" />
                    Tips
                  </h3>
                  <ul className="space-y-1">
                    {guide.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
