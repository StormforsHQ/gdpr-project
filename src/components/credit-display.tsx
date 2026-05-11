"use client";

import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { getOpenRouterUsage } from "@/app/actions/ai-settings";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function creditColor(remaining: number): string {
  if (remaining <= 1) return "text-red-500 dark:text-red-400";
  if (remaining <= 5) return "text-amber-500 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
}

function shortModel(model: string): string {
  const name = model.split("/").pop() || model;
  return name.length > 20 ? name.slice(0, 20) + "..." : name;
}

export function CreditDisplay() {
  const [data, setData] = useState<{
    configured: boolean;
    usage?: number;
    limit?: number;
    remaining?: number;
    model?: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const result = await getOpenRouterUsage();
      if (mounted) setData(result);
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (!data?.configured || data.remaining === undefined) return null;

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2 cursor-help">
          <Coins className="h-3.5 w-3.5 shrink-0" />
          <span className={creditColor(data.remaining)}>${data.remaining.toFixed(2)}</span>
          {data.model && (
            <span className="opacity-60">{shortModel(data.model)}</span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs text-black dark:text-black">
        <div className="space-y-1">
          <p>OpenRouter credit remaining: <strong>${data.remaining.toFixed(2)}</strong></p>
          {data.usage !== undefined && <p>Total spent: ${data.usage.toFixed(2)}{data.limit !== undefined && ` of $${data.limit.toFixed(2)} limit`}</p>}
          {data.model && <p>Model: {data.model}</p>}
          <p className="opacity-60">This is your total OpenRouter balance, not per-scan cost. Change model in Settings.</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
