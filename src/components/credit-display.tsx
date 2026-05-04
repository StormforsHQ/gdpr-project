"use client";

import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { getOpenRouterUsage } from "@/app/actions/ai-settings";

function creditColor(remaining: number): string {
  if (remaining <= 1) return "text-red-500 dark:text-red-400";
  if (remaining <= 5) return "text-amber-500 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
}

export function CreditDisplay() {
  const [data, setData] = useState<{
    configured: boolean;
    usage?: number;
    limit?: number;
    remaining?: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetch() {
      const result = await getOpenRouterUsage();
      if (mounted) setData(result);
    }

    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (!data?.configured || data.remaining === undefined) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
      <Coins className="h-3.5 w-3.5 shrink-0" />
      <span>
        OpenRouter: <span className={creditColor(data.remaining)}>${data.remaining.toFixed(2)}</span>
      </span>
    </div>
  );
}
