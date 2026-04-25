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
import type { Check, CheckStatus } from "@/lib/checklist";
import { STATUS_CONFIG } from "@/lib/checklist";
import { CircleDashed, CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";

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
  onStatusChange: (status: CheckStatus) => void;
  onNotesChange: (notes: string) => void;
}

export function CheckItem({
  check,
  status,
  notes,
  onStatusChange,
  onNotesChange,
}: CheckItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b last:border-b-0">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {STATUS_ICONS[status]}
        <span className="text-xs font-mono text-muted-foreground w-7 shrink-0">
          {check.key}
        </span>
        <span className="text-sm flex-1">{check.label}</span>
        <Badge
          variant={status === "issue" ? "destructive" : "secondary"}
          className="text-xs"
        >
          {STATUS_CONFIG[status].label}
        </Badge>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pl-14 space-y-3">
          <p className="text-xs text-muted-foreground">{check.description}</p>
          <div className="flex items-center gap-3">
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
