import { extractBrandVariations } from "./brand";
import type { WebsiteData } from "./types";

export function normalizeDomain(input: string): string {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .trim();
}

export async function tryFetch(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

export function parseWebsiteHtml(html: string, domain: string, sourceUrl: string): WebsiteData {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const metaMatch =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  const metaDescription = metaMatch ? metaMatch[1].trim() : "";

  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1s = h1Matches
    .map((m) => m[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim())
    .filter((h) => h.length > 0)
    .slice(0, 5);

  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1500);

  const brandVariations = extractBrandVariations(html, domain);

  return { url: sourceUrl, title, metaDescription, h1s, bodyText, brandVariations };
}

export async function getWebsiteData(domain: string): Promise<WebsiteData | null> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const urlsToTry = [
    `https://${cleanDomain}`,
    `http://${cleanDomain}`,
    `https://www.${cleanDomain}`,
  ];

  for (const url of urlsToTry) {
    const html = await tryFetch(url);
    if (html) return parseWebsiteHtml(html, domain, url);
  }
  return null;
}
