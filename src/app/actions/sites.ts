"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { normalizeUrl } from "@/lib/url";
import { detectGtmId, detectCookiebotId } from "@/lib/scanner";
import { isGtmConfigured, findCookiebotIdInContainer } from "@/lib/api/gtm";
import { isWebflowConfigured, findWebflowSiteByDomain } from "@/lib/api/webflow";
import * as cheerio from "cheerio";

export async function getSites() {
  return prisma.site.findMany({
    orderBy: { name: "asc" },
    include: {
      audits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          results: true,
        },
      },
    },
  });
}

export async function getSite(id: string) {
  return prisma.site.findUnique({
    where: { id },
    include: {
      audits: {
        orderBy: { createdAt: "desc" },
        include: {
          results: true,
        },
      },
    },
  });
}

export async function createSite(data: {
  name: string;
  url: string;
  platform?: string;
  webflowId?: string;
  cookiebotId?: string;
  gtmId?: string;
}) {
  const cleanUrl = normalizeUrl(data.url).replace(/^https?:\/\//, "");

  const existing = await prisma.site.findFirst({
    where: {
      OR: [
        { url: cleanUrl },
        { name: data.name },
      ],
    },
  });

  if (existing) {
    const match = existing.url === cleanUrl ? "URL" : "name";
    return { error: `A site with this ${match} already exists: "${existing.name}" (${existing.url})` };
  }

  const site = await prisma.site.create({
    data: {
      name: data.name,
      url: cleanUrl,
      platform: data.platform || "webflow",
      webflowId: data.webflowId || null,
      cookiebotId: data.cookiebotId || null,
      gtmId: data.gtmId || null,
    },
  });

  revalidatePath("/sites");
  revalidatePath("/");
  return site;
}

export async function updateSite(
  id: string,
  data: {
    name?: string;
    url?: string;
    platform?: string;
    webflowId?: string | null;
    cookiebotId?: string | null;
    gtmId?: string | null;
  }
) {
  const updateData = { ...data };
  if (updateData.url) {
    updateData.url = normalizeUrl(updateData.url).replace(/^https?:\/\//, "");
  }
  const site = await prisma.site.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/sites");
  revalidatePath(`/sites/${id}`);
  revalidatePath("/");
  return site;
}

export async function deleteSite(id: string) {
  await prisma.site.delete({
    where: { id },
  });

  revalidatePath("/sites");
  revalidatePath("/");
}

export async function bulkCreateSites(
  sites: { name: string; url: string; platform?: string; webflowId?: string }[]
) {
  const created = await prisma.site.createMany({
    data: sites.map((s) => ({
      name: s.name,
      url: normalizeUrl(s.url).replace(/^https?:\/\//, ""),
      platform: s.platform || "webflow",
      webflowId: s.webflowId || null,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/sites");
  revalidatePath("/");
  return created;
}

export interface DetectIdsResult {
  webflowId: string | null;
  webflowSource: string | null;
  gtmId: string | null;
  cookiebotId: string | null;
  gtmSource: string | null;
  cookiebotSource: string | null;
  error: string | null;
}

export async function detectSiteIds(url: string): Promise<DetectIdsResult> {
  const result: DetectIdsResult = {
    webflowId: null, webflowSource: null,
    gtmId: null, cookiebotId: null,
    gtmSource: null, cookiebotSource: null,
    error: null,
  };

  try {
    const normalizedUrl = normalizeUrl(url);
    const response = await fetch(normalizedUrl, {
      headers: { "User-Agent": "StormforsGDPRAudit/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      result.error = `Could not reach the site (HTTP ${response.status}). Check the URL.`;
      return result;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    result.gtmId = detectGtmId($, html);
    if (result.gtmId) result.gtmSource = "Found in site HTML";

    result.cookiebotId = detectCookiebotId($);
    if (result.cookiebotId) result.cookiebotSource = "Found in site HTML";

    if (result.gtmId && !result.cookiebotId && isGtmConfigured()) {
      try {
        const cbid = await findCookiebotIdInContainer(result.gtmId);
        if (cbid) {
          result.cookiebotId = cbid;
          result.cookiebotSource = `Found inside GTM container (${result.gtmId})`;
        }
      } catch {
        // GTM API not available - not an error for the user
      }
    }

    if (isWebflowConfigured()) {
      try {
        const domain = new URL(normalizedUrl).hostname.replace(/^www\./, "");
        const wfSite = await findWebflowSiteByDomain(domain);
        if (wfSite) {
          result.webflowId = wfSite.id;
          result.webflowSource = `Matched Webflow site "${wfSite.displayName}"`;
        }
      } catch (wfErr) {
        const wfMsg = wfErr instanceof Error ? wfErr.message : "Unknown error";
        console.error("Webflow lookup failed:", wfMsg);
        if (/missing_scopes|sites:read/i.test(wfMsg)) {
          result.webflowSource = "Webflow API missing 'sites:read' scope - re-authorize the app with this scope enabled";
        } else if (/401|unauthorized/i.test(wfMsg)) {
          result.webflowSource = "Webflow API token expired or invalid - re-authorize the app";
        } else {
          result.webflowSource = "Webflow lookup failed - check server logs for details";
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (/fetch failed|ENOTFOUND|getaddrinfo/i.test(msg)) {
      result.error = "Could not reach the site. Check the URL and make sure it's online.";
    } else if (/timed? ?out|aborted/i.test(msg)) {
      result.error = "The site took too long to respond. Try again later.";
    } else {
      result.error = `Detection failed: ${msg}`;
    }
  }

  return result;
}
