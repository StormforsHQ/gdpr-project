"use client";

import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { getOpenRouterUsage } from "@/app/actions/ai-settings";

function formatCost(n: number): string {
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

export function CreditDisplay() {
  const [data, setData] = useState<{
    configured: boolean;
    model?: string;
    lastRunCost?: number;
    last24hCost?: number;
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

  if (!data?.configured) return null;

  const model = data.model?.split("/").pop() || data.model;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
      <Coins className="h-3.5 w-3.5 shrink-0" />
      {data.lastRunCost != null && (
        <span>Last run {formatCost(data.lastRunCost)}</span>
      )}
      {data.last24hCost != null && data.last24hCost > 0 && (
        <>
          <span className="opacity-40">|</span>
          <span>24h {formatCost(data.last24hCost)}</span>
        </>
      )}
      {model && (
        <>
          <span className="opacity-40">|</span>
          <span className="opacity-60">{model}</span>
        </>
      )}
    </div>
  );
}
