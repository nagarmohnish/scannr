import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { detectBrand, extractBrandVariations, extractSnippet } from "@/lib/scanner/brand";

const sampleHtml = readFileSync(
  join(__dirname, "..", "fixtures", "sample-site.html"),
  "utf8"
);

describe("extractBrandVariations", () => {
  it("returns the domain root as a fallback when html is empty", () => {
    const v = extractBrandVariations("", "acmecompost.com");
    expect(v).toContain("acmecompost");
  });

  it("extracts site name from og:site_name", () => {
    const v = extractBrandVariations(sampleHtml, "acmecompost.com");
    expect(v).toEqual(expect.arrayContaining(["Acme Compost"]));
  });

  it("includes both spaced and joined variations", () => {
    const v = extractBrandVariations(sampleHtml, "acmecompost.com");
    expect(v).toEqual(expect.arrayContaining(["Acme Compost", "AcmeCompost"]));
  });

  it("filters out generic words like 'home' and short tokens", () => {
    const v = extractBrandVariations(
      "<title>Home</title><h1>Welcome</h1>",
      "acmecompost.com"
    );
    expect(v).not.toContain("home");
    expect(v).not.toContain("welcome");
    expect(v.every((s) => s.length >= 3)).toBe(true);
  });

  it("handles hyphenated domains", () => {
    const v = extractBrandVariations("", "answer-the-public.com");
    expect(v).toEqual(expect.arrayContaining(["answer-the-public", "answerthepublic", "answer the public"]));
  });

  // Regression: multi-word brands made of common English words used to leak
  // sub-words ("shark", "tank", "blog") into the variation list, which
  // substring-matched every unrelated mention of those words.
  it("does not emit individual sub-words for multi-word brands", () => {
    const html =
      '<title>Shark Tank Blog</title>' +
      '<meta property="og:site_name" content="Shark Tank Blog">' +
      '<h1>Shark Tank Blog</h1>';
    const v = extractBrandVariations(html, "sharktankblog.com");

    expect(v).toEqual(
      expect.arrayContaining(["Shark Tank Blog", "SharkTankBlog", "sharktankblog"])
    );
    expect(v).not.toContain("shark");
    expect(v).not.toContain("tank");
    expect(v).not.toContain("blog");
  });

  it("does not emit individual sub-words for camelCase brands", () => {
    const html =
      '<title>DigitalOcean</title>' +
      '<meta property="og:site_name" content="DigitalOcean">';
    const v = extractBrandVariations(html, "digitalocean.com");

    expect(v).toEqual(expect.arrayContaining(["DigitalOcean", "digitalocean"]));
    expect(v).not.toContain("digital");
    expect(v).not.toContain("ocean");
  });
});

describe("detectBrand", () => {
  it("matches when brand appears verbatim", () => {
    expect(detectBrand("I recommend CleverTap", ["CleverTap"])).toBe(true);
  });

  it("matches when brand appears with spaces stripped", () => {
    expect(detectBrand("Try Clever Tap for analytics", ["CleverTap"])).toBe(true);
  });

  it("is case insensitive", () => {
    expect(detectBrand("clevertap is good", ["CleverTap"])).toBe(true);
  });

  it("ignores punctuation and symbols", () => {
    expect(detectBrand("the C.l.e.v.e.r.T.a.p tool", ["CleverTap"])).toBe(true);
  });

  it("returns false when brand is absent", () => {
    expect(detectBrand("Try Mixpanel", ["CleverTap"])).toBe(false);
  });

  it("ignores variations shorter than 3 chars", () => {
    expect(detectBrand("ab abc", ["ab"])).toBe(false);
  });

  it("matches any variation in the list", () => {
    expect(detectBrand("I love AnswerThePublic", ["foo", "answerthepublic"])).toBe(true);
  });
});

describe("extractSnippet", () => {
  it("returns context around the matched brand", () => {
    const text = "Many tools exist. One is CleverTap, which is great for analytics. There are others.";
    const snippet = extractSnippet(text, ["CleverTap"]);
    expect(snippet).toMatch(/CleverTap/);
  });

  it("returns leading content when no brand matches", () => {
    const text = "x".repeat(300);
    const snippet = extractSnippet(text, ["NonExistent"]);
    expect(snippet.endsWith("...")).toBe(true);
    expect(snippet.length).toBeLessThan(text.length);
  });

  it("handles a brand with punctuation in the response", () => {
    const text = "I would recommend C.l.e.v.e.r.T.a.p for this case";
    const snippet = extractSnippet(text, ["CleverTap"]);
    expect(snippet).toContain("C.l.e.v.e.r.T.a.p");
  });
});
