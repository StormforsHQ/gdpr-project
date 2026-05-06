"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Info, Search } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { updateSite, deleteSite, detectSiteIds } from "@/app/actions/sites";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditSiteDialogProps {
  site: {
    id: string;
    name: string;
    url: string;
    platform: string;
    cookiebotId?: string | null;
    gtmId?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSiteDialog({ site, open, onOpenChange }: EditSiteDialogProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(site.name);
  const [url, setUrl] = useState(site.url);
  const [platform, setPlatform] = useState(site.platform);
  const [cookiebotId, setCookiebotId] = useState(site.cookiebotId || "");
  const [gtmId, setGtmId] = useState(site.gtmId || "");

  const handleDetect = async () => {
    if (!url.trim()) return;
    setDetecting(true);
    setDetectResult(null);
    try {
      const result = await detectSiteIds(url.trim());
      if (result.error) {
        setDetectResult(result.error);
        return;
      }
      const messages: string[] = [];
      if (result.gtmId) {
        setGtmId(result.gtmId);
        messages.push(`GTM: ${result.gtmId}`);
      }
      if (result.cookiebotId) {
        setCookiebotId(result.cookiebotId);
        messages.push(`Cookiebot: ${result.cookiebotId}`);
      }
      if (messages.length > 0) {
        setDetectResult(`Found: ${messages.join(", ")}`);
      } else {
        setDetectResult("No GTM or Cookiebot found on this site. You can enter them manually if you know the IDs - check GTM at tagmanager.google.com and Cookiebot at cookiebot.com.");
      }
    } catch {
      setDetectResult("Detection failed. Try entering the IDs manually.");
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setSaving(true);
    try {
      await updateSite(site.id, {
        name: name.trim(),
        url: url.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""),
        platform,
        cookiebotId: cookiebotId.trim() || null,
        gtmId: gtmId.trim() || null,
      });

      toast.success("Site updated");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update site");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSite(site.id);
      toast.success(`${site.name} deleted`);
      onOpenChange(false);
      router.push("/sites");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete site");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setConfirmDelete(false); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Site name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-url">URL</Label>
            <Input
              id="edit-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-platform">Platform</Label>
            <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webflow">Webflow</SelectItem>
                <SelectItem value="hubspot">HubSpot</SelectItem>
                <SelectItem value="nextjs">Next.js</SelectItem>
                <SelectItem value="wordpress">WordPress</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={detecting || !url.trim()}
                onClick={handleDetect}
                className="gap-1.5"
              >
                {detecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                {detecting ? "Scanning site..." : "Detect IDs from site"}
              </Button>
              <span className="text-xs text-muted-foreground">Scans the URL to find GTM and Cookiebot IDs</span>
            </div>
            {detectResult && (
              <p className={`text-xs leading-relaxed ${detectResult.startsWith("Found:") ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                {detectResult}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="edit-cookiebotId">Cookiebot ID</Label>
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed !block">
                    <div>
                      <p>Each website that uses Cookiebot has its own ID - a long code that looks like 1a2b3c4d-5e6f-... (called a UUID).</p>
                      <p className="mt-1.5">To find it: log in to cookiebot.com, select the website, and look under Settings. You'll need admin access to the Cookiebot account - ask the person who manages cookie consent for your clients.</p>
                      <p className="mt-1.5 opacity-60">Several cookie consent checks cannot run without this ID.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="edit-cookiebotId"
                placeholder="e.g. 1a2b3c4d-5e6f-..."
                value={cookiebotId}
                onChange={(e) => setCookiebotId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="edit-gtmId">GTM Container ID</Label>
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed !block">
                    <div>
                      <p>Google Tag Manager is a tool that manages all tracking scripts on a website. Each website has a container with an ID that starts with GTM- (e.g. GTM-ABC1234).</p>
                      <p className="mt-1.5">To find it: go to tagmanager.google.com, open the website's container - the ID is shown at the top next to the container name. You'll need access to the GTM account - ask the developer or site admin.</p>
                      <p className="mt-1.5 opacity-60">Several GTM configuration checks cannot run without this ID.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="edit-gtmId"
                placeholder="GTM-XXXXXXX"
                value={gtmId}
                onChange={(e) => setGtmId(e.target.value)}
              />
            </div>
          </div>
          {confirmDelete && (
            <div className="flex items-center gap-3 pt-2 border-t border-destructive/20">
              <span className="text-xs text-destructive">Delete this site and all its audits?</span>
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  No
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  Yes, delete
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            {!confirmDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                Delete site
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !name.trim() || !url.trim()}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
