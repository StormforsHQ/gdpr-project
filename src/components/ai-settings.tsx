"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, X } from "lucide-react";
import {
  getAISettings,
  saveAISettings,
  clearAPIKey,
  fetchAvailableModels,
  checkAPIKeyStatus,
  type OpenRouterModel,
  type AISettings,
} from "@/app/actions/ai-settings";

function formatPrice(perToken: string): string {
  const perMillion = parseFloat(perToken) * 1_000_000;
  if (perMillion === 0) return "Free";
  if (perMillion < 0.01) return "<$0.01/M";
  return `$${perMillion.toFixed(2)}/M`;
}

export function AISettingsPanel() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{
    configured: boolean;
    source: "settings" | "env" | "none";
    credits?: number;
    error?: string;
  } | null>(null);
  const [newApiKey, setNewApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, status, m] = await Promise.all([
        getAISettings(),
        checkAPIKeyStatus(),
        fetchAvailableModels(),
      ]);
      setSettings(s);
      setKeyStatus(status);
      setModels(m);
    } catch {
      setResult({ type: "error", message: "Failed to load AI settings" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setResult(null);

    const res = await saveAISettings({
      primaryModel: settings.primaryModel,
      fallbackModel: settings.fallbackModel,
      apiKey: newApiKey || undefined,
    });

    if (res.success) {
      setResult({ type: "success", message: "Settings saved" });
      setNewApiKey("");
      setDirty(false);
      await load();
    } else {
      setResult({ type: "error", message: res.error || "Failed to save" });
    }
    setSaving(false);
  };

  const handleClearKey = async () => {
    await clearAPIKey();
    setResult({ type: "success", message: "API key removed. Using environment variable if configured." });
    await load();
  };

  const updateModel = (field: "primaryModel" | "fallbackModel", value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading AI settings...
      </div>
    );
  }

  if (!settings) return null;

  const primaryModel = models.find((m) => m.id === settings.primaryModel);
  const fallbackModel = models.find((m) => m.id === settings.fallbackModel);
  const sameModel = settings.primaryModel === settings.fallbackModel;

  return (
    <div className="space-y-5 pb-2">
      <p className="text-sm text-muted-foreground">
        AI checks use <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline">OpenRouter</a> to
        access language models. Choose your preferred models and manage your API key below.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Primary model</label>
          {models.length > 0 ? (
            <Select value={settings.primaryModel} onValueChange={(v) => v && updateModel("primaryModel", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue>
                  {primaryModel ? `${primaryModel.name} (${formatPrice(primaryModel.pricing.prompt)} in / ${formatPrice(primaryModel.pricing.completion)} out)` : settings.primaryModel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id} disabled={m.id === settings.fallbackModel}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="truncate">{m.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatPrice(m.pricing.prompt)} in / {formatPrice(m.pricing.completion)} out
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground">{settings.primaryModel}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Fallback model</label>
          <p className="text-xs text-muted-foreground">Used when the primary model fails or is unavailable.</p>
          {models.length > 0 ? (
            <Select value={settings.fallbackModel} onValueChange={(v) => v && updateModel("fallbackModel", v)}>
              <SelectTrigger className={`h-9 text-sm ${sameModel ? "border-destructive" : ""}`}>
                <SelectValue>
                  {fallbackModel ? `${fallbackModel.name} (${formatPrice(fallbackModel.pricing.prompt)} in / ${formatPrice(fallbackModel.pricing.completion)} out)` : settings.fallbackModel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id} disabled={m.id === settings.primaryModel}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="truncate">{m.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatPrice(m.pricing.prompt)} in / {formatPrice(m.pricing.completion)} out
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground">{settings.fallbackModel}</p>
          )}
          {sameModel && (
            <p className="text-xs text-destructive">Primary and fallback models must be different.</p>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t">
        <label className="text-sm font-medium">OpenRouter API key</label>
        <div className="flex items-center gap-2">
          {keyStatus?.configured ? (
            <Badge
              variant="secondary"
              className="text-xs bg-green-500/15 text-green-600 dark:text-green-400"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active via {keyStatus.source === "settings" ? "Settings" : "environment variable"}
              {keyStatus.credits !== undefined && ` - $${keyStatus.credits.toFixed(2)} remaining`}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not configured
            </Badge>
          )}
          {keyStatus?.error && (
            <Badge variant="destructive" className="text-xs">{keyStatus.error}</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={keyStatus?.configured ? "Enter new key to replace current one..." : "sk-or-v1-..."}
              value={newApiKey}
              onChange={(e) => { setNewApiKey(e.target.value); setDirty(true); }}
              className="h-9 text-sm pr-8"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {keyStatus?.source === "settings" && (
            <Button variant="ghost" size="sm" className="h-9 text-xs gap-1 text-destructive hover:text-destructive" onClick={handleClearKey}>
              <X className="h-3 w-3" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Get your API key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/keys</a>.
          {keyStatus?.source === "env" && " A key saved here will override the environment variable."}
        </p>
      </div>

      {result && (
        <div
          className={`flex items-start gap-2 rounded-md p-3 text-sm ${
            result.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {result.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          {result.message}
        </div>
      )}

      {dirty && (
        <div className="flex gap-3">
          <Button size="sm" onClick={handleSave} disabled={saving || sameModel}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { load(); setDirty(false); setNewApiKey(""); }}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
