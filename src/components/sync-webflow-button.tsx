"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, X } from "lucide-react";
import { syncWebflowSites } from "@/app/actions/sites";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SyncWebflowButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    abortRef.current = new AbortController();
    try {
      const result = await syncWebflowSites();
      if (abortRef.current?.signal.aborted) return;
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Synced ${result.total} Webflow sites: ${result.created} new, ${result.updated} updated, ${result.activeCount} with custom domains`
      );
      router.refresh();
    } catch (err) {
      if (abortRef.current?.signal.aborted) return;
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setSyncing(false);
    toast.info("Sync cancelled. Any sites already imported are saved.");
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleSync}
        disabled={syncing}
      >
        {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {syncing ? "Syncing..." : "Sync from Webflow"}
      </Button>
      {syncing && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleCancel}
          title="Cancel sync"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
