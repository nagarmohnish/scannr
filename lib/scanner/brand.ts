const GENERIC_WORDS = new Set([
  "home",
  "index",
  "welcome",
  "untitled",
  "page",
  "website",
  "site",
]);

export function extractBrandVariations(html: string, domain: string): string[] {
  const domainRoot = domain
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .split(".")[0];

  const signals: string[] = [
    html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/i)?.[1],
    html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:site_name"/i)?.[1],
    html
      .match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)?.[1]
      ?.split(/[|\-–:]/)[0]
      .trim(),
    html
      .match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i)?.[1]
      ?.split(/[|\-–:]/)[0]
      .trim(),
    html
      .match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
      ?.split(/[|\-–:]/)[0]
      .trim(),
    html.match(/<meta[^>]*name="application-name"[^>]*content="([^"]+)"/i)?.[1],
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim(),
    domainRoot,
  ].filter((s): s is string => !!s && s.length >= 2);

  const raw = new Set<string>();

  // For each signal we emit the full brand string in 4 punctuation/spacing
  // variants. `detectBrand` normalizes both response and variation to
  // alphanumeric-only before comparing, so e.g. "CleverTap" matches "Clever Tap"
  // without us having to enumerate every casing.
  //
  // We deliberately do NOT emit individual sub-words ("shark", "tank", "blog")
  // from multi-word brands — those would substring-match any unrelated mention
  // of the word and inflate scores massively.
  signals.forEach((signal) => {
    raw.add(signal);
    raw.add(signal.replace(/\s+/g, ""));
    raw.add(signal.replace(/-/g, " "));
    raw.add(signal.replace(/[\s-]/g, ""));
  });

  raw.add(domainRoot);
  raw.add(domainRoot.replace(/-/g, ""));
  raw.add(domainRoot.replace(/-/g, " "));

  return [...raw].filter(
    (v) => v && v.length >= 3 && !GENERIC_WORDS.has(v.toLowerCase())
  );
}

export function detectBrand(
  responseText: string,
  brandVariations: string[]
): boolean {
  const normalizedResponse = responseText.toLowerCase().replace(/[^a-z0-9]/g, "");

  const found = brandVariations.find((variation) => {
    if (!variation || variation.length < 3) return false;
    const normalizedVariation = variation.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalizedVariation.length < 3) return false;
    return normalizedResponse.includes(normalizedVariation);
  });

  return !!found;
}

export function extractSnippet(
  text: string,
  brandVariations: string[]
): string {
  const rawLower = text.toLowerCase();
  const stripped = rawLower.replace(/[^a-z0-9]/g, "");

  let matchIndex = -1;
  for (const v of brandVariations) {
    const normalizedVariation = v.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalizedVariation.length < 3) continue;
    const strippedIdx = stripped.indexOf(normalizedVariation);
    if (strippedIdx === -1) continue;
    let count = 0;
    for (let i = 0; i < rawLower.length; i++) {
      if (/[a-z0-9]/.test(rawLower[i])) count++;
      if (count > strippedIdx) {
        matchIndex = i;
        break;
      }
    }
    break;
  }

  if (matchIndex === -1)
    return text.slice(0, 200) + (text.length > 200 ? "..." : "");
  const start = Math.max(0, matchIndex - 80);
  const end = Math.min(text.length, matchIndex + 160);
  return (
    (start > 0 ? "..." : "") +
    text.slice(start, end) +
    (end < text.length ? "..." : "")
  );
}
