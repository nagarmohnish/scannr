# scannr — Architecture & Agents

This document explains what scannr does, how its agents work together, and where every piece lives in the code. Read this before changing anything in [`lib/scanner/`](../lib/scanner/) or [`app/api/scan/`](../app/api/scan/).

---

## 1. What scannr is

scannr is an **AI visibility scanner** for B2B brands.

When a buyer asks ChatGPT, Gemini, Claude, or Perplexity to recommend tools in a given category, does *your* brand come up? scannr answers that question by:

1. Reading the customer's website,
2. Asking Claude to infer the company's ICP (ideal customer profile) and generate 24 buyer-intent prompts,
3. Running those 24 prompts against 4 AI engines in parallel,
4. Scoring how often the brand actually appears in the answers, broken down by intent stage (informational / discovery / commercial / transactional).

The free scanner runs without any signup. Paid tiers (Phase 2+) add daily monitoring and content generation.

---

## 2. The two agents

There are **two distinct agents** at work:

### Agent 1 — Prompt Generator (Claude)
Lives in [`lib/scanner/generate.ts`](../lib/scanner/generate.ts). Used by [`/api/scan/generate-prompts`](../app/api/scan/generate-prompts/route.ts).

**Input**: a domain (e.g. `acmecompost.com`)

**Steps**:
1. Fetch the website's HTML (3-URL fallback: `https://`, `http://`, `https://www.`).
2. Parse out `title`, `meta description`, `H1`s, first 1500 chars of body text, and **brand variations** (alphanumeric variants of the brand name, used later for fuzzy matching).
3. Optionally fetch real buyer queries from Reddit, Quora, YouTube, and Google's People Also Ask (via the `/api/scan/research` endpoint, which uses Serper).
4. Build a long Claude prompt that contains:
   - The parsed website content,
   - The research data (if any),
   - Strict instructions for what to return.
5. Call `claude-sonnet-4-5`.
6. Strip code fences, `JSON.parse`, clean `companyName`, attach `brandVariations`.

**Output**:
```ts
{
  businessProfile: {
    companyName, whatTheySell, industry, geography, businessModel
  },
  icp: {
    primaryBuyer, buyerLocation, buyerCompanySize, buyerPainPoint, buyerContext
  },
  prompts: {
    informational: [6 prompts],   // buyer learning about the category
    discovery:     [6 prompts],   // buyer looking for vendors
    commercial:    [6 prompts],   // buyer comparing options
    transactional: [6 prompts],   // buyer ready to buy
  },
  brandVariations: ["Acme Compost", "AcmeCompost", "acmecompost", ...]
}
```

**Why ICP + intent stages?** A buyer who is *learning* about the category uses different language than one who is *ready to buy*. Generic SEO tools that test only "head terms" miss this. By splitting prompts across 4 intent stages, scannr shows where the brand has presence (e.g. strong in informational, weak in transactional → buyers find competitors when they're ready to spend).

### Agent 2 — Scanner Engines (Claude / OpenAI / Gemini / Perplexity)
Lives in [`lib/scanner/engines.ts`](../lib/scanner/engines.ts) (per-engine API calls) and [`lib/scanner/scan.ts`](../lib/scanner/scan.ts) (orchestration). Used by [`/api/scan/run`](../app/api/scan/run/route.ts).

**Input**: the 24 prompts + the brand variations from Agent 1.

**Steps**:
1. Build `EngineAdapters` from `process.env` — an adapter is included only if its key is present.
2. For each available engine, send all 24 prompts in parallel (small stagger to avoid burst rate limits).
3. For each response, run `detectBrand(responseText, brandVariations)` — normalize both to alphanumeric-only and substring-check.
4. Extract a context snippet around the matched brand (or the leading 200 chars if no match).
5. Roll up appearances per engine, per intent category, and overall.

**Output** ([`ScanResults`](../lib/scanner/types.ts)):
```ts
{
  overallScore: 0..100,
  engines: {
    gemini:     { score, available },
    claude:     { score, available },
    chatgpt:    { score, available },
    perplexity: { score, available },
  },
  categoryScores: {
    informational: { appeared, total },
    discovery:     { appeared, total },
    commercial:    { appeared, total },
    transactional: { appeared, total },
  },
  results: [
    { prompt, category,
      gemini:     { appeared, snippet },
      claude:     { appeared, snippet },
      chatgpt:    { appeared, snippet },
      perplexity: { appeared, snippet },
    }, // × 24
  ]
}
```

---

## 3. End-to-end request flow

```
User enters domain in landing page (app/page.tsx)
     │
     ▼
POST /api/scan/generate-prompts  ──── Agent 1 ────► Claude → ICP + 24 prompts
     │                                              (with website + research context)
     │
     ▼
POST /api/scan/run               ──── Agent 2 ────► Gemini   ┐
     │                                              Claude   ├─ all 4 engines run
     │                                              OpenAI   │  24 prompts in parallel
     │                                              Perplex. ┘
     │
     ▼
Brand detection per response  ─────► appeared: true/false + snippet
     │
     ▼
Scoring rollup  ────► overallScore, per-engine scores, per-category scores
     │
     ▼
Frontend renders:
  - ICP summary card  (from generate-prompts response)
  - Per-engine score bars
  - Per-category breakdown table
  - Insights panel ("strongest intent", "biggest gap")
  - Email capture wall
```

Two helper endpoints support the flow:

- **`/api/scan/research`** — fetches real buyer-query data from Reddit, Quora, YouTube, and Google PAA. Each source fails independently. Used inline by Agent 1.
- **`/api/scan/keywords`** — separate keyword recommendations (tier 1 high-intent / tier 2 mid-intent / tier 3 awareness). Kicks off in the background after the scan is done.

---

## 4. Code layout

### `lib/scanner/` — pure, testable agent logic

| Module | Exports | Responsibility |
|---|---|---|
| [`types.ts`](../lib/scanner/types.ts) | `Category`, `BusinessProfile`, `Icp`, `FlatPrompt`, `EngineResult`, `PromptResult`, `ScanResults`, `WebsiteData` | All shared types — single source of truth |
| [`parse.ts`](../lib/scanner/parse.ts) | `stripCodeFences`, `cleanCompanyName` | String cleaning for Claude output |
| [`brand.ts`](../lib/scanner/brand.ts) | `extractBrandVariations`, `detectBrand`, `extractSnippet` | Brand recognition — the **alphanumeric-only** normalization is the core trick. It works for `AnswerThePublic`, `boAt`, `eco365`, hyphenated domains, brands with punctuation in the response, etc. |
| [`domain.ts`](../lib/scanner/domain.ts) | `normalizeDomain`, `tryFetch`, `parseWebsiteHtml`, `getWebsiteData` | URL handling + website HTML extraction (3-URL fallback, 6s timeout, browser UA) |
| [`rate-limit.ts`](../lib/scanner/rate-limit.ts) | `createRateLimiter` factory | In-memory IP rate limiter (max + window, with optional injected `now()` for tests) |
| [`engines.ts`](../lib/scanner/engines.ts) | `queryClaude`, `queryOpenAI`, `queryGemini`, `queryPerplexity`, `EngineAdapters`, `buildEngineAdaptersFromEnv` | Per-engine API calls. Each takes `(prompt, apiKey)` and returns **raw response text**. No brand detection here. |
| [`generate.ts`](../lib/scanner/generate.ts) | `buildClaudePrompt`, `parseGeneratePromptsResponse`, `generateIcpForDomain` | Agent 1 — fully dependency-injected so tests pass fake `anthropic` clients |
| [`scan.ts`](../lib/scanner/scan.ts) | `flattenPrompts`, `runScan`, `scoreResults` | Agent 2 — orchestrates engines, scores results |

### `app/api/scan/` — thin HTTP wrappers

Each route file is responsible for:
- Reading the request body & validating shape
- Applying its rate limiter
- Reading env (route is the only place that touches `process.env` for engine keys, indirectly via `buildEngineAdaptersFromEnv`)
- Calling into `lib/scanner` and returning the JSON response

| Route | Calls into | Notes |
|---|---|---|
| [`generate-prompts/route.ts`](../app/api/scan/generate-prompts/route.ts) | `generateIcpForDomain` | Also owns the 24-hour in-memory prompt cache + per-domain dedup lock |
| [`run/route.ts`](../app/api/scan/run/route.ts) | `runScan` | Builds adapters from env, accepts client-passed `brandVariations` (falls back to domain-derived if missing) |
| [`research/route.ts`](../app/api/scan/research/route.ts) | Exports `fetchResearchData` directly (no lib extraction yet — Serper + Reddit only) | Imported by `generate-prompts` route for inline use |
| [`keywords/route.ts`](../app/api/scan/keywords/route.ts) | Self-contained — calls Claude + Serper directly | Background call, scan does not wait for it |
| [`leads/capture/route.ts`](../app/api/leads/capture/route.ts) | Stores email + scan score | Phase 2 email capture |

### `app/page.tsx` — landing page state machine

The landing page is one big React state machine driving four UI phases: `idle` → `generating` → `scanning` → `done` (or `error`). It calls the two scan endpoints sequentially, animates engine state per phase, and after `done` triggers the background keywords fetch + (if logged in) saves the scan to Supabase.

### `components/scanner/` — UI

- `HeroSection` — domain input
- `ScanningAnimation` — the 4 engines lighting up
- `ResultsSection` — score + per-engine + per-category table + insights + email wall

---

## 5. The two key design decisions

### Decision 1: 24 prompts × 4 intent categories
Generic AI-visibility tools test 5–10 "head terms" per brand. That misses the funnel. By forcing the prompt generator to produce 6 prompts per intent stage, scannr surfaces gaps like *"strong in informational queries but invisible to ready-to-buy queries"* — which is what most B2B brands actually care about.

### Decision 2: Alphanumeric-only brand normalization
Brand names show up in LLM responses with arbitrary punctuation, case, and whitespace: `Clever Tap`, `CleverTap`, `clever-tap`, `C.l.e.v.e.r.T.a.p`. To match all of these reliably without false positives, `detectBrand` strips both the response and the brand variation to letters and digits, then runs a substring check. A 3-character minimum prevents short noise tokens from matching. This is what makes detection work for any brand, in any language casing, forever — without per-brand tuning.

---

## 6. Where to extend

### Add a new engine (e.g. Mistral, DeepSeek)
1. Add `queryMistral(prompt, apiKey): Promise<string>` to [`engines.ts`](../lib/scanner/engines.ts).
2. Extend the `EngineName` union and `EngineAdapters` interface in [`types.ts`](../lib/scanner/types.ts) + [`engines.ts`](../lib/scanner/engines.ts).
3. Wire it in `buildEngineAdaptersFromEnv` and the 4-engine `Promise.all` in [`scan.ts`](../lib/scanner/scan.ts).
4. Update `scoreResults` to include the new engine in `engineAppearances`.
5. Add `MISTRAL_API_KEY` to [`.env.local`](../.env.local) and the README env list.
6. Add `tests/integration/mistral.live.test.ts` mirroring the others.

### Change the scoring formula
[`scoreResults`](../lib/scanner/scan.ts) is pure — input is `(results, adapters)`, output is `ScanResults`. Add weights, normalize differently, or break out per-engine-per-category — all changes are local to one function and covered by [`tests/unit/scan.test.ts`](../tests/unit/scan.test.ts).

### Change the Claude prompt for ICP generation
[`buildClaudePrompt`](../lib/scanner/generate.ts) is a pure function of `{ domain, websiteData, research }`. Edit there. Snapshot the output if you want a regression test.

### Persist scans to a database
The page currently saves scans to Supabase only if the user is logged in. To make this server-side, move the insert into `/api/scan/run` (or a new `/api/scan/save` endpoint) — but be careful: the run route is meant to be called by anonymous users for the free scan.

---

## 7. Test coverage

| Layer | Unit tests | Live tests |
|---|---|---|
| `parse.ts` | [`tests/unit/parse.test.ts`](../tests/unit/parse.test.ts) | n/a |
| `brand.ts` | [`tests/unit/brand.test.ts`](../tests/unit/brand.test.ts) | n/a |
| `domain.ts` | [`tests/unit/domain.test.ts`](../tests/unit/domain.test.ts) — mocks `global.fetch` for the 3-URL fallback | n/a |
| `rate-limit.ts` | [`tests/unit/rate-limit.test.ts`](../tests/unit/rate-limit.test.ts) — injects `now()` to test window expiry | n/a |
| `engines.ts` (fetch-based) | [`tests/unit/engines.test.ts`](../tests/unit/engines.test.ts) — mocks `global.fetch` for Gemini/OpenAI/Perplexity | [`claude.live.test.ts`](../tests/integration/claude.live.test.ts), [`openai.live.test.ts`](../tests/integration/openai.live.test.ts), [`gemini.live.test.ts`](../tests/integration/gemini.live.test.ts), [`perplexity.live.test.ts`](../tests/integration/perplexity.live.test.ts) |
| `engines.ts` (Claude/SDK) | [`tests/unit/engines-claude.test.ts`](../tests/unit/engines-claude.test.ts) — `vi.mock("@anthropic-ai/sdk")` | (same as above) |
| `generate.ts` | [`tests/unit/generate.test.ts`](../tests/unit/generate.test.ts) — injects fake `anthropic`, `fetchWebsite`, `fetchResearch` | (covered by pipeline test) |
| `scan.ts` | [`tests/unit/scan.test.ts`](../tests/unit/scan.test.ts) — injects mock adapters; tests scoring corner cases | n/a |
| Full pipeline | n/a | [`pipeline.live.test.ts`](../tests/integration/pipeline.live.test.ts) — generates real ICP + scans 4 prompts against real engines |

Live tests skip themselves unless `RUN_LIVE_TESTS=true` AND the relevant key is present (not `placeholder-*`). Run via:

```bash
npm test                    # all unit, skips live
npm run test:live           # all live (needs keys)
npm run test:live:claude    # just one engine
```

---

## 8. Common gotchas

- **Rate limits are in-memory.** Restarting the dev server resets them. Fine for the free scanner; for production multi-instance, swap `createRateLimiter` for a Redis-backed implementation. The factory shape stays the same.
- **The prompt cache is also in-memory** and per-process. Same caveat.
- **Engine staggering**: Claude gets a 300ms stagger between prompts (rate-limit tighter); others use 50ms. Tune in `runScan({ staggerMs })` if you hit limits.
- **Brand detection is substring-based.** "Notion" matches inside "Notional" — currently rare in real LLM output, but watch for it on short common-word brand names.
- **`extractBrandVariations` drops tokens shorter than 3 chars.** Single-letter brand names (`X`, `O`) won't match. If this is a problem, lower the threshold in [`brand.ts`](../lib/scanner/brand.ts) — but you'll see more false positives.
- **Supabase placeholders**: [`.env.local`](../.env.local) ships with `https://placeholder.supabase.co` so the landing page renders without a real Supabase project. Auth + dashboard pages need real values.
- **`generate-prompts` is rate-limited at 3 scans / IP / day.** During testing pass `?nocache=true` to bypass the cache; the rate limit still applies (reset by restarting `next dev`).
