"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { syncWebflowSites } from "@/app/actions/sites";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SyncWebflowButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncWebflowSites();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Synced ${result.total} Webflow sites: ${result.created} new, ${result.updated} updated, ${result.activeCount} with custom domains`
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
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
  );
}
