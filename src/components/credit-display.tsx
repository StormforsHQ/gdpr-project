"use client";

import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { getOpenRouterUsage } from "@/app/actions/ai-settings";

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
        ${data.remaining.toFixed(2)} remaining
        {data.usage !== undefined && <span className="hidden sm:inline"> - ${data.usage.toFixed(2)} used</span>}
      </span>
    </div>
  );
}
