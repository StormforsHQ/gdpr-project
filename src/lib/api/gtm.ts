const API_BASE = "https://tagmanager.googleapis.com/tagmanager/v2";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

let cachedToken: { value: string; expiresAt: number } | null = null;

type ContainerInfo = { accountId: string; containerId: string; name: string; publicId: string };
let containerMapCache: { map: Map<string, ContainerInfo>; expiresAt: number } | null = null;
const CONTAINER_CACHE_TTL = 60 * 60 * 1000; // 1 hour - containers rarely change

function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export function isGtmConfigured(): boolean {
  return !!getOAuthConfig();
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const config = getOAuthConfig();
  if (!config) throw new Error("GTM OAuth not configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token refresh failed ${res.status}: ${body}`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

async function gtmFetch(path: string, options?: RequestInit) {
  const token = await getAccessToken();
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (res.status === 429 && attempt < maxRetries) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "0", 10);
      const delay = Math.max(retryAfter * 1000, (attempt + 1) * 15_000);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GTM API ${res.status}: ${body}`);
    }

    return res.json();
  }
}

export interface GtmTag {
  tagId: string;
  name: string;
  type: string;
  paused?: boolean;
  firingTriggerId?: string[];
  consentSettings?: {
    consentStatus: string;
    consentType?: { type: string; status: string }[];
  };
  parameter?: { key: string; value: string; type: string }[];
  path: string;
}

export interface GtmTrigger {
  triggerId: string;
  name: string;
  type: string;
  path: string;
}

export async function listTags(accountId: string, containerId: string, workspaceId: string): Promise<GtmTag[]> {
  const data = await gtmFetch(
    `/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`
  );
  return data.tag || [];
}

export async function getTag(path: string): Promise<GtmTag> {
  return gtmFetch(`/${path}`);
}

export async function updateTag(path: string, tag: Partial<GtmTag>): Promise<GtmTag> {
  return gtmFetch(`/${path}`, {
    method: "PUT",
    body: JSON.stringify(tag),
  });
}

export async function listTriggers(accountId: string, containerId: string, workspaceId: string): Promise<GtmTrigger[]> {
  const data = await gtmFetch(
    `/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers`
  );
  return data.trigger || [];
}

export async function listWorkspaces(accountId: string, containerId: string): Promise<{ workspaceId: string; name: string }[]> {
  const data = await gtmFetch(`/accounts/${accountId}/containers/${containerId}/workspaces`);
  return (data.workspace || []).map((w: { workspaceId: string; name: string }) => ({
    workspaceId: w.workspaceId,
    name: w.name,
  }));
}

async function loadContainerMap(): Promise<Map<string, ContainerInfo>> {
  if (containerMapCache && Date.now() < containerMapCache.expiresAt) {
    return containerMapCache.map;
  }

  const map = new Map<string, ContainerInfo>();
  const accounts = await gtmFetch("/accounts");
  const errors: string[] = [];

  for (const account of accounts.account || []) {
    try {
      const containers = await gtmFetch(`/accounts/${account.accountId}/containers`);
      for (const c of (containers.container || []) as { containerId: string; name: string; publicId: string }[]) {
        map.set(c.publicId, {
          accountId: account.accountId,
          containerId: c.containerId,
          name: c.name,
          publicId: c.publicId,
        });
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  if (map.size === 0 && errors.length > 0) {
    throw new Error(`Failed to list GTM containers: ${errors[0]}`);
  }

  containerMapCache = { map, expiresAt: Date.now() + CONTAINER_CACHE_TTL };
  return map;
}

export async function getContainerInfo(publicId: string): Promise<ContainerInfo> {
  const map = await loadContainerMap();
  const info = map.get(publicId);
  if (info) return info;
  throw new Error(`GTM container ${publicId} not found in any accessible account`);
}

export async function findCookiebotIdInContainer(gtmPublicId: string): Promise<string | null> {
  const container = await getContainerInfo(gtmPublicId);
  const workspaces = await listWorkspaces(container.accountId, container.containerId);
  const defaultWs = workspaces.find((w) => w.name === "Default Workspace") || workspaces[0];
  if (!defaultWs) return null;

  const tags = await listTags(container.accountId, container.containerId, defaultWs.workspaceId);

  const CBID_PARAM_KEYS = /^(serial|cbid|cookiebotId|CookiebotID|altCbid)$/i;
  const COOKIEBOT_TEMPLATE_PARAMS = /^(consentModeEnabled|cdnRegion|waitForUpdate|iabFramework)$/i;

  for (const tag of tags) {
    const isCookiebotType = /cookiebot/i.test(tag.type) || /cookiebot/i.test(tag.name);
    const isCvtWithSignature = /^cvt_/i.test(tag.type)
      && (tag.parameter || []).some((p) => CBID_PARAM_KEYS.test(p.key))
      && (tag.parameter || []).some((p) => COOKIEBOT_TEMPLATE_PARAMS.test(p.key));

    if (!isCookiebotType && !isCvtWithSignature) continue;

    for (const param of tag.parameter || []) {
      if (CBID_PARAM_KEYS.test(param.key) && param.value) {
        return param.value;
      }
    }
  }

  for (const tag of tags) {
    for (const param of tag.parameter || []) {
      if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(param.value)) {
        if (/cookiebot|consent|cookie/i.test(tag.name) || CBID_PARAM_KEYS.test(param.key)) {
          return param.value;
        }
      }
    }
  }

  return null;
}
