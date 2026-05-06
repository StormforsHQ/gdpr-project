const API_BASE = "https://tagmanager.googleapis.com/tagmanager/v2";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

let cachedToken: { value: string; expiresAt: number } | null = null;

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

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GTM API ${res.status}: ${body}`);
  }

  return res.json();
}

export interface GtmTag {
  tagId: string;
  name: string;
  type: string;
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

export async function getContainerInfo(containerId: string): Promise<{
  accountId: string;
  containerId: string;
  name: string;
  publicId: string;
}> {
  const accounts = await gtmFetch("/accounts");
  for (const account of accounts.account || []) {
    try {
      const containers = await gtmFetch(`/accounts/${account.accountId}/containers`);
      const container = (containers.container || []).find(
        (c: { publicId: string }) => c.publicId === containerId
      );
      if (container) {
        return {
          accountId: account.accountId,
          containerId: container.containerId,
          name: container.name,
          publicId: container.publicId,
        };
      }
    } catch {}
  }
  throw new Error(`GTM container ${containerId} not found`);
}

export async function findCookiebotIdInContainer(gtmPublicId: string): Promise<string | null> {
  const container = await getContainerInfo(gtmPublicId);
  const workspaces = await listWorkspaces(container.accountId, container.containerId);
  const defaultWs = workspaces.find((w) => w.name === "Default Workspace") || workspaces[0];
  if (!defaultWs) return null;

  const tags = await listTags(container.accountId, container.containerId, defaultWs.workspaceId);

  for (const tag of tags) {
    const isCookiebotType = /cookiebot/i.test(tag.type) || /cookiebot/i.test(tag.name);
    if (!isCookiebotType) continue;

    for (const param of tag.parameter || []) {
      if (/cbid|cookiebotId|CookiebotID/i.test(param.key)) {
        return param.value;
      }
    }
  }

  // Fallback: check all tags for a parameter value that looks like a Cookiebot UUID
  for (const tag of tags) {
    for (const param of tag.parameter || []) {
      if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(param.value)) {
        if (/cookiebot|consent|cookie/i.test(tag.name) || /cookiebot|cbid/i.test(param.key)) {
          return param.value;
        }
      }
    }
  }

  return null;
}
