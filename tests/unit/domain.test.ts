import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getWebsiteData, normalizeDomain, parseWebsiteHtml } from "@/lib/scanner/domain";

const sampleHtml = readFileSync(
  join(__dirname, "..", "fixtures", "sample-site.html"),
  "utf8"
);

describe("normalizeDomain", () => {
  it("lowercases", () => {
    expect(normalizeDomain("AcmeCompost.com")).toBe("acmecompost.com");
  });

  it("strips https://", () => {
    expect(normalizeDomain("https://acmecompost.com")).toBe("acmecompost.com");
  });

  it("strips http://", () => {
    expect(normalizeDomain("http://acmecompost.com")).toBe("acmecompost.com");
  });

  it("strips www.", () => {
    expect(normalizeDomain("www.acmecompost.com")).toBe("acmecompost.com");
  });

  it("strips trailing slash", () => {
    expect(normalizeDomain("acmecompost.com/")).toBe("acmecompost.com");
  });

  it("strips all of the above together", () => {
    expect(normalizeDomain("HTTPS://www.AcmeCompost.com/")).toBe("acmecompost.com");
  });
});

describe("parseWebsiteHtml", () => {
  const parsed = parseWebsiteHtml(sampleHtml, "acmecompost.com", "https://acmecompost.com");

  it("extracts title", () => {
    expect(parsed.title).toContain("Acme Compost");
  });

  it("extracts meta description", () => {
    expect(parsed.metaDescription).toContain("certified compostable food packaging");
  });

  it("extracts H1s", () => {
    expect(parsed.h1s).toContain("Acme Compost");
  });

  it("strips scripts and styles from bodyText", () => {
    expect(parsed.bodyText).not.toContain("console.log");
    expect(parsed.bodyText).not.toContain("display: none");
  });

  it("returns brand variations", () => {
    expect(parsed.brandVariations.length).toBeGreaterThan(0);
    expect(parsed.brandVariations).toEqual(expect.arrayContaining(["Acme Compost"]));
  });
});

describe("getWebsiteData (mocked fetch)", () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns parsed data on a 200 from the first URL", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => sampleHtml,
    }) as unknown as typeof fetch;

    const data = await getWebsiteData("acmecompost.com");
    expect(data).not.toBeNull();
    expect(data?.title).toContain("Acme Compost");
  });

  it("falls back through https → http → www on failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, text: async () => sampleHtml });
    global.fetch = fetchMock as unknown as typeof fetch;

    const data = await getWebsiteData("acmecompost.com");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(data?.title).toContain("Acme Compost");
  });

  it("returns null when all 3 URL attempts fail", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
    const data = await getWebsiteData("acmecompost.com");
    expect(data).toBeNull();
  });

  it("returns null on network errors", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    const data = await getWebsiteData("acmecompost.com");
    expect(data).toBeNull();
  });
});
