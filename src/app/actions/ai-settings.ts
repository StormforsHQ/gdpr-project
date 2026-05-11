"use server";

import { prisma } from "@/lib/db";

export interface AISettings {
  primaryModel: string;
  fallbackModel: string;
  apiKey: string;
}

const DEFAULTS: AISettings = {
  primaryModel: "google/gemini-2.5-flash",
  fallbackModel: "google/gemini-2.5-flash-lite",
  apiKey: "",
};

export async function getAISettings(): Promise<AISettings> {
  try {
    const rows = await prisma.appSetting.findMany({
      where: { key: { in: ["ai_primary_model", "ai_fallback_model", "ai_api_key"] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      primaryModel: map.ai_primary_model || DEFAULTS.primaryModel,
      fallbackModel: map.ai_fallback_model || DEFAULTS.fallbackModel,
      apiKey: map.ai_api_key || "",
    };
  } catch {
    return DEFAULTS;
  }
}

export async function saveAISettings(settings: {
  primaryModel: string;
  fallbackModel: string;
  apiKey?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (settings.primaryModel === settings.fallbackModel) {
    return { success: false, error: "Primary and fallback models must be different" };
  }

  try {
    const entries: { key: string; value: string }[] = [
      { key: "ai_primary_model", value: settings.primaryModel },
      { key: "ai_fallback_model", value: settings.fallbackModel },
    ];

    if (settings.apiKey !== undefined && settings.apiKey !== "") {
      entries.push({ key: "ai_api_key", value: settings.apiKey });
    }

    await prisma.$transaction(
      entries.map((e) =>
        prisma.appSetting.upsert({
          where: { key: e.key },
          update: { value: e.value },
          create: { key: e.key, value: e.value },
        })
      )
    );

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save" };
  }
}

export async function clearAPIKey(): Promise<{ success: boolean }> {
  try {
    await prisma.appSetting.deleteMany({ where: { key: "ai_api_key" } });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export interface OpenRouterModel {
  id: string;
  name: string;
  pricing: { prompt: string; completion: string };
}

export async function fetchAvailableModels(): Promise<OpenRouterModel[]> {
  const apiKey = await getEffectiveAPIKey();
  if (!apiKey) return [];

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.data as { id: string; name: string; pricing: { prompt: string; completion: string } }[])
      .filter((m) => m.pricing && parseFloat(m.pricing.prompt) >= 0)
      .sort((a, b) => parseFloat(a.pricing.prompt) - parseFloat(b.pricing.prompt))
      .map((m) => ({
        id: m.id,
        name: m.name,
        pricing: m.pricing,
      }));
  } catch {
    return [];
  }
}

export async function checkAPIKeyStatus(): Promise<{
  configured: boolean;
  source: "settings" | "env" | "none";
  credits?: number;
  error?: string;
}> {
  const dbKey = await prisma.appSetting.findUnique({ where: { key: "ai_api_key" } }).catch(() => null);
  const envKey = process.env.OPENROUTER_API_KEY;

  const activeKey = dbKey?.value || envKey;
  if (!activeKey) {
    return { configured: false, source: "none" };
  }

  const source = dbKey?.value ? "settings" as const : "env" as const;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${activeKey}` },
    });
    if (!res.ok) {
      return { configured: true, source, error: "Invalid API key" };
    }
    const data = await res.json();
    return {
      configured: true,
      source,
      credits: data.data?.usage !== undefined
        ? Math.max(0, (data.data.limit ?? 0) - data.data.usage)
        : undefined,
    };
  } catch {
    return { configured: true, source, error: "Could not verify key" };
  }
}

export async function getEffectiveAPIKey(): Promise<string | null> {
  const dbKey = await prisma.appSetting.findUnique({ where: { key: "ai_api_key" } }).catch(() => null);
  return dbKey?.value || process.env.OPENROUTER_API_KEY || null;
}

export async function getOpenRouterUsage(): Promise<{
  configured: boolean;
  model?: string;
  lastRunCost?: number;
  last24hCost?: number;
} | null> {
  const apiKey = await getEffectiveAPIKey();
  if (!apiKey) return { configured: false };

  try {
    const settings = await getAISettings();

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRuns = await prisma.scanRun.findMany({
      where: { scanType: "ai-agent", cost: { not: null }, startedAt: { gte: since24h } },
      select: { cost: true, startedAt: true },
      orderBy: { startedAt: "desc" },
    });

    const lastRunCost = recentRuns[0]?.cost ?? undefined;
    const last24hCost = recentRuns.reduce((sum, r) => sum + (r.cost ?? 0), 0);

    return {
      configured: true,
      model: settings.primaryModel,
      lastRunCost: lastRunCost != null ? Math.round(lastRunCost * 10000) / 10000 : undefined,
      last24hCost: last24hCost > 0 ? Math.round(last24hCost * 10000) / 10000 : undefined,
    };
  } catch {
    return { configured: true };
  }
}
