"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { normalizeUrl } from "@/lib/url";

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
