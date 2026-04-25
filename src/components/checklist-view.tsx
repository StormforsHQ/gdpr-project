"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckItem } from "@/components/check-item";
import { CheckGuideDrawer } from "@/components/check-guide-drawer";
import { CHECKLIST, type CheckStatus } from "@/lib/checklist";
import { ChevronDown, ChevronRight } from "lucide-react";

type CheckState = Record<string, { status: CheckStatus; notes: string }>;

export function ChecklistView() {
  const [checkStates, setCheckStates] = useState<CheckState>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CHECKLIST.map((c) => c.id))
  );
  const [guideKey, setGuideKey] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const openGuide = (key: string) => {
    setGuideKey(key);
    setGuideOpen(true);
  };

  const getCheckState = (key: string) =>
    checkStates[key] ?? { status: "not_checked" as CheckStatus, notes: "" };

  const updateCheck = (key: string, field: "status" | "notes", value: string) => {
    setCheckStates((prev) => ({
      ...prev,
      [key]: { ...getCheckState(key), [field]: value },
    }));
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

  const totalChecks = CHECKLIST.reduce((sum, c) => sum + c.checks.length, 0);
  const totalChecked = Object.values(checkStates).filter(
    (s) => s.status !== "not_checked"
  ).length;
  const totalIssues = Object.values(checkStates).filter(
    (s) => s.status === "issue"
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          Progress: {totalChecked}/{totalChecks} checked
        </span>
        {totalIssues > 0 && (
          <Badge variant="destructive">{totalIssues} issue{totalIssues !== 1 ? "s" : ""}</Badge>
        )}
      </div>

      {CHECKLIST.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const stats = getCategoryStats(category.id);

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
                {category.checks.map((check) => {
                  const state = getCheckState(check.key);
                  return (
                    <CheckItem
                      key={check.key}
                      check={check}
                      status={state.status}
                      notes={state.notes}
                      onStatusChange={(s) => updateCheck(check.key, "status", s)}
                      onNotesChange={(n) => updateCheck(check.key, "notes", n)}
                      onOpenGuide={openGuide}
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
    </div>
  );
}
