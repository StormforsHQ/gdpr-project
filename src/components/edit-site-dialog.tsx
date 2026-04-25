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
import { Loader2 } from "lucide-react";
import { updateSite, deleteSite } from "@/app/actions/sites";
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
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(site.name);
  const [url, setUrl] = useState(site.url);
  const [platform, setPlatform] = useState(site.platform);
  const [cookiebotId, setCookiebotId] = useState(site.cookiebotId || "");
  const [gtmId, setGtmId] = useState(site.gtmId || "");

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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cookiebotId">Cookiebot ID</Label>
              <Input
                id="edit-cookiebotId"
                placeholder="Optional"
                value={cookiebotId}
                onChange={(e) => setCookiebotId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-gtmId">GTM Container ID</Label>
              <Input
                id="edit-gtmId"
                placeholder="GTM-XXXXXXX"
                value={gtmId}
                onChange={(e) => setGtmId(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive">Delete this site and all its audits?</span>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete site
                </Button>
              )}
            </div>
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
