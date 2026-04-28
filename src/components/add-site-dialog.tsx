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
import { Plus, Loader2 } from "lucide-react";
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
      const site = await createSite({
        name: name.trim(),
        url: url.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""),
        platform,
        cookiebotId: cookiebotId.trim() || undefined,
        gtmId: gtmId.trim() || undefined,
      });

      toast.success(`${site.name} added`);
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
              <Label htmlFor="cookiebotId">Cookiebot ID</Label>
              <Input
                id="cookiebotId"
                placeholder="Optional"
                value={cookiebotId}
                onChange={(e) => setCookiebotId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gtmId">GTM Container ID</Label>
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
