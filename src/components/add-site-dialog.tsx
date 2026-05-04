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
import { Plus, Loader2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createSite } from "@/app/actions/sites";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddSiteDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("webflow");
  const [cookiebotId, setCookiebotId] = useState("");
  const [gtmId, setGtmId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setSaving(true);
    try {
      const result = await createSite({
        name: name.trim(),
        url: url.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""),
        platform,
        cookiebotId: cookiebotId.trim() || undefined,
        gtmId: gtmId.trim() || undefined,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(`${result.name} added`);
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create site");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setUrl("");
    setPlatform("webflow");
    setCookiebotId("");
    setGtmId("");
  };

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add site
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Site name</Label>
            <Input
              id="name"
              placeholder="Example Client AB"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="cookiebotId">Cookiebot ID</Label>
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
                id="cookiebotId"
                placeholder="e.g. 1a2b3c4d-5e6f-..."
                value={cookiebotId}
                onChange={(e) => setCookiebotId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="gtmId">GTM Container ID</Label>
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
                id="gtmId"
                placeholder="GTM-XXXXXXX"
                value={gtmId}
                onChange={(e) => setGtmId(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !url.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add site
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
