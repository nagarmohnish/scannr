# scannr — Phase 2 Roadmap & Implementation Spec

**Audience**: Claude Code (executing agent) + engineering review.
**Companion doc**: [`docs/architecture.md`](./architecture.md) — read first; this spec assumes you already know how `lib/scanner/*` and `app/api/scan/*` work.
**Goal**: Transform scannr from a free one-shot AI visibility scanner into a full GEO (Generative Engine Optimization) platform with citation tracking, competitor benchmarking, publication targeting, search intelligence, and a validated recommendation loop.

> **How to use this doc**: each feature section has (a) purpose, (b) new types, (c) new/modified files, (d) API surface, (e) UI components, (f) acceptance criteria. Phases are sequenced — don't start Phase N+1 until Phase N's acceptance criteria pass. UI design system is in §11. Existing patterns (rate-limiter factory, dependency-injected adapters, pure scoring functions) MUST be preserved.

---

## 0. North-star vision

A closed loop, end-to-end:

```
AI scan → which prompts you're invisible on
       → which publications LLMs cite for those prompts
       → which journalists work at those publications
       → which underlying search queries drive that content
       → which queries you can realistically rank on
       → content brief targeting all of the above
       → re-scan and measure lift (validation framework)
       → drift alerts on regression
```

No competitor product (Profound, AthenaHQ, Otterly, Peec) connects all of these in one workflow today. That gap is scannr's wedge.

---

## 1. Phase plan

| Phase | Scope | Estimate | Dependencies |
|---|---|---|---|
| **P1** | Infrastructure: persistence, citation extraction from engines, DataForSEO integration scaffold | 1 wk | none |
| **P2** | Share of Voice + Competitor Benchmarking (Features A + B) | 1 wk | P1 |
| **P3** | Brand Citation Tracking + Sentiment (Feature C) | 4 days | P1 |
| **P4** | Publication Targeting + PR Engine (Feature E) | 1 wk | P1, P2 |
| **P5** | Search Intelligence + Query Landscape (Feature F) | 1 wk | P1 |
| **P6** | AI Content Recommendations (Feature D) | 4 days | P2, P4, P5 |
| **P7** | Validation Framework (Feature G) | 1 wk | P1 |
| **P8** | UI polish, drift detector, alerting, onboarding | 1 wk | all |

Total: ~7 weeks for first complete release.

---

## 2. Infrastructure prerequisites (Phase 1)

### 2.1 Persistence layer

Everything past the free one-shot scan requires durable storage. Current in-memory rate limiter and prompt cache stay for the free tier, but all paid-tier data lives in Postgres (via Supabase, which the app already partially integrates with).

**New tables** (Supabase migration in `supabase/migrations/`):

```sql
-- Workspaces & users (Supabase auth handles auth.users)
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id),
  name text not null,
  primary_domain text not null,
  industry text,
  brand_variations jsonb,        -- array of strings
  competitors jsonb,             -- array of {name, brandVariations, source: 'inferred'|'pinned'}
  created_at timestamptz default now()
);

create table scans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  domain text not null,
  triggered_by text not null,    -- 'manual' | 'scheduled' | 'baseline' | 'post_intervention'
  status text not null,          -- 'pending' | 'running' | 'complete' | 'failed'
  started_at timestamptz default now(),
  completed_at timestamptz,
  business_profile jsonb,
  icp jsonb,
  overall_score numeric,
  notes text
);

create table scan_runs (
  -- a scan can have multiple runs for variance characterisation (validation framework)
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references scans(id) on delete cascade,
  run_index int not null,         -- 1..N
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table prompt_results (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid references scan_runs(id) on delete cascade,
  prompt text not null,
  category text not null,         -- informational | discovery | commercial | transactional
  engine text not null,           -- claude | chatgpt | gemini | perplexity
  appeared boolean not null,
  brand_position int,             -- 1-indexed, null if not appeared
  snippet text,
  full_response text,
  response_hash text,             -- sha256 of full_response; dedup for sentiment calls
  created_at timestamptz default now()
);

create table mentions (
  -- one row per brand mention in a response (your brand + competitors + extracted unknowns)
  id uuid primary key default gen_random_uuid(),
  prompt_result_id uuid references prompt_results(id) on delete cascade,
  brand text not null,
  is_subject_brand boolean not null,   -- true if the workspace's own brand
  position int not null,
  character_offset int,
  in_list_context boolean,
  snippet text,
  sentiment text,                       -- positive | neutral | negative | mixed | null
  sentiment_confidence numeric,
  inaccurate boolean default false,
  inaccuracy_reason text
);

create table citations (
  -- citations extracted from engine grounding metadata
  id uuid primary key default gen_random_uuid(),
  prompt_result_id uuid references prompt_results(id) on delete cascade,
  url text not null,
  domain text not null,
  title text,
  snippet text,
  position_in_response int
);

create table keyword_universes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  generated_at timestamptz default now(),
  expires_at timestamptz,           -- 30 days
  source text default 'auto'        -- 'auto' | 'custom'
);

create table keyword_entries (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid references keyword_universes(id) on delete cascade,
  query text not null,
  google_volume int,
  bing_volume int,
  trend text,                       -- rising | stable | declining
  trend_values jsonb,               -- 12 monthly values
  intent_stage text,
  difficulty numeric,
  ai_overview_present boolean,
  linked_prompts jsonb              -- array of prompt strings this query underlies
);

create table serp_snapshots (
  id uuid primary key default gen_random_uuid(),
  keyword_entry_id uuid references keyword_entries(id) on delete cascade,
  captured_at timestamptz default now(),
  positions jsonb                   -- array of {domain, position, type, url, title}
);

create table opportunities (
  -- "publish on X to fix Y" — joins citation gaps with workspace presence
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  scan_id uuid references scans(id),
  domain text not null,             -- target publication
  citation_frequency_in_category numeric,
  presence_score numeric,           -- 0..1, how much workspace is already there
  difficulty_score int,             -- 1..10
  opportunity_score numeric,        -- computed
  prompts_unlocked jsonb,
  recommended_action text,          -- 'guest_post' | 'reddit_thread' | 'wikipedia_edit' | etc.
  generated_at timestamptz default now()
);

create table content_briefs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  opportunity_id uuid references opportunities(id),
  target_queries jsonb,             -- keyword_entry_ids
  brief_markdown text,
  status text default 'draft',      -- draft | published | measured
  created_at timestamptz default now()
);

create table interventions (
  -- log of customer actions for attribution
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  opportunity_id uuid references opportunities(id),
  type text,                        -- 'content_published' | 'pr_placement' | 'schema_added'
  executed_at timestamptz,
  url text,
  notes text
);

create table drift_alerts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  alert_type text,                  -- 'appearance_drop' | 'sentiment_shift' | 'competitor_surge'
  metric_name text,
  baseline_value numeric,
  current_value numeric,
  delta_sigma numeric,              -- how many std deviations the change is
  triggered_at timestamptz default now(),
  acknowledged boolean default false
);
```

Add Supabase row-level security policies so workspace data is owner-scoped. Service role bypasses RLS for cron jobs.

### 2.2 Citation extraction from engine APIs

This is the single highest-leverage change. Currently `lib/scanner/engines.ts` returns raw response text only. Extend each `query*` function:

**New return shape** (modify `types.ts`):

```ts
export type EngineCitation = {
  url: string;
  domain: string;        // derived from URL; normalised (no www, lowercased)
  title?: string;
  snippet?: string;
};

export type EngineResponse = {
  text: string;
  citations: EngineCitation[];
};
```

Modify each engine function in `lib/scanner/engines.ts`:

- **`queryPerplexity`**: API already returns `citations` array — currently discarded. Pass through.
- **`queryOpenAI`**: switch to the Responses API with `web_search` tool. Extract `url_citation` annotations from `output[].content[].annotations[]`. Without web_search, citations will be empty (acceptable — flag this on the result).
- **`queryGemini`**: enable Google Search grounding via `tools: [{ googleSearchRetrieval: {} }]`. Extract `groundingMetadata.groundingChunks[].web.uri` and `groundingSupports`.
- **`queryClaude`**: enable `web_search_20250305` tool. Extract citations from text block annotations.

All four functions now return `EngineResponse` instead of `string`. Update callers in `scan.ts` and all unit tests accordingly.

Caveat to document: each engine's citations represent that engine's *grounding sources*, not what the LLM was trained on. Two engines answering the same prompt may cite zero overlapping sources. That's expected and informative.

### 2.3 DataForSEO client

New module: `lib/scanner/dataforseo.ts`. Thin typed wrapper around the endpoints we need. Pay-as-you-go billing; ~$0.0006/SERP call so don't bother with aggressive caching in v1.

```ts
export type DataforseoClient = {
  searchVolume: (keywords: string[], locationCode: number, languageCode: string) =>
    Promise<Array<{ keyword: string; searchVolume: number | null; cpc: number | null }>>;

  bingSearchVolume: (keywords: string[], locationCode: number) =>
    Promise<Array<{ keyword: string; searchVolume: number | null }>>;

  googleTrends: (keywords: string[], timeRange: '7d'|'30d'|'12m', locationCode: number) =>
    Promise<Array<{ keyword: string; timeline: Array<{ date: string; value: number }>; relatedQueries: string[] }>>;

  relatedKeywords: (seed: string, locationCode: number, limit?: number) =>
    Promise<Array<{ keyword: string; searchVolume: number; difficulty: number }>>;

  serpOrganic: (keyword: string, locationCode: number, depth?: number) =>
    Promise<{
      organic: Array<{ position: number; domain: string; url: string; title: string }>;
      aiOverviewPresent: boolean;
      featuredSnippet: { domain: string; url: string } | null;
      peopleAlsoAsk: string[];
    }>;

  aiOverview: (keyword: string, locationCode: number) =>
    Promise<{ present: boolean; text?: string; references?: Array<{ url: string; title: string }> }>;

  domainAuthority: (domain: string) =>
    Promise<{ domain: string; domainRank: number; backlinks: number; referringDomains: number }>;
};

export function buildDataforseoClient(): DataforseoClient {
  const user = process.env.DATAFORSEO_USER!;
  const pass = process.env.DATAFORSEO_PASS!;
  // ...implementation using fetch with basic auth, retry-on-429, structured error handling
}
```

Add to `.env.local`:
```
DATAFORSEO_USER=
DATAFORSEO_PASS=
```

Unit tests in `tests/unit/dataforseo.test.ts` mock `global.fetch`.

### 2.4 Other new env vars

```
SUPABASE_SERVICE_ROLE_KEY=    # for server-side writes from cron jobs
MUCKRACK_API_KEY=             # journalist database
SERPER_API_KEY=               # already in use, document it
RESEND_API_KEY=               # transactional email for drift alerts
CRON_SECRET=                  # shared secret for protected cron endpoints
```

### 2.5 Acceptance criteria for Phase 1

- [ ] Migration runs cleanly on a fresh Supabase project.
- [ ] All four `query*` functions return `EngineResponse` with citations populated when keys + grounding are present.
- [ ] Unit tests for `engines.ts` updated to verify citation extraction paths.
- [ ] `dataforseo.ts` has 100% unit test coverage on the seven methods, all mocking `fetch`.
- [ ] A `tests/integration/dataforseo.live.test.ts` exists that runs only when `DATAFORSEO_USER` is set and `RUN_LIVE_TESTS=true`, hitting `searchVolume` for a single keyword.
- [ ] The existing pipeline test still passes end-to-end.

---

## 3. Feature A — Share of Voice & Prompt Intelligence (Phase 2)

### 3.1 Purpose

Move beyond "did your brand appear?" to: every brand mentioned, its position, prominence, and your share of voice across the prompt set.

### 3.2 New module

`lib/scanner/extract.ts`:

```ts
import type { BrandMention, EngineCitation } from './types';

export type ExtractInput = {
  responseText: string;
  knownBrands: Array<{ name: string; variations: string[]; isSubject: boolean }>;
  anthropic: AnthropicClient;
  cache?: Map<string, BrandMention[]>;   // hash(text) → mentions
};

export async function extractBrandMentions(input: ExtractInput): Promise<BrandMention[]>;

// Two-pass:
// Pass 1 — deterministic. For each known brand, scan with alphanumeric normalisation;
//   record character offset of first occurrence. Flag list context (item near "1.", "- ", "* ").
// Pass 2 — LLM. Single Haiku call: "List every company/product name in this text in order of
//   appearance, JSON array." Merge with Pass 1, dedupe by alphanumeric form.
// Output mentions sorted by position (1-indexed).
```

New type in `types.ts`:

```ts
export type BrandMention = {
  brand: string;            // canonical/display form
  brandKey: string;         // alphanumeric-lowercase, for matching
  isSubjectBrand: boolean;
  position: number;         // 1-indexed
  characterOffset: number;
  inListContext: boolean;
  snippet: string;
};

export type EngineResult = {
  appeared: boolean;
  mentions: BrandMention[];
  yourMention: BrandMention | null;
  topThree: string[];       // first 3 distinct brand mentions (by brandKey)
  citations: EngineCitation[];
  snippet: string;          // existing field, kept for back-compat
};
```

### 3.3 Modify `scan.ts`

Update `runScan` to pass `knownBrands` (subject brand + competitors from `generate.ts`) through to the per-response detection step. Replace single `detectBrand` call with `extractBrandMentions`.

### 3.4 Modify `scoreResults`

Add Share-of-Voice metrics. New fields on `ScanResults`:

```ts
export type ShareOfVoice = {
  perBrand: Array<{
    brand: string;
    isSubject: boolean;
    totalMentions: number;
    appearanceRate: number;          // mentions / total prompts × engines
    avgPosition: number | null;
    topThreeRate: number;            // % of responses where brand is in first 3 mentions
    perCategory: Record<Category, { mentions: number; appearanceRate: number }>;
    perEngine: Record<EngineName, { mentions: number; appearanceRate: number }>;
  }>;
  totalMentions: number;
};
```

Compute share of voice as `(brand.totalMentions / totalMentions) × 100`. The subject brand and all detected competitors get rows; unknown brands surfaced by Pass 2 above a frequency threshold also appear.

### 3.5 API surface

No new routes. `/api/scan/run` returns the extended `ScanResults` with `shareOfVoice` populated.

### 3.6 UI

New section in `components/scanner/ResultsSection.tsx`:

- **Share of Voice bar chart** — horizontal stacked bar, subject brand highlighted, top 8 competitors visible, "Others" bucket. Hover reveals exact %.
- **Top 3 Presence rate** — single big number, plus per-category breakdown grid.
- **Brand mention matrix** — table: rows = brands, columns = the 4 intent categories, cells = appearance rate %. Subject brand row pinned top. Cells colour-coded (green/yellow/red).
- **Position distribution** — small histogram of "when our brand appears, where in the response?" 1st mention vs 5th matters.

### 3.7 Acceptance criteria

- [ ] `extract.ts` has unit tests covering: subject-brand-only, multiple brands in list context, Haiku Pass 2 dedup, cache hit path.
- [ ] `scoreResults` unit tests cover: SoV = 100% (only brand mentioned), SoV = 0% (never appears), unknown brand promotion threshold.
- [ ] Frontend renders SoV chart and matrix correctly for a fixture scan with 8 brands.
- [ ] Existing free-tier scan still works with `knownBrands = [subjectBrand]` (no competitors yet).

---

## 4. Feature B — Competitor Benchmarking (Phase 2, parallel to A)

### 4.1 Purpose

Surface which competitors beat the subject brand, on which prompts, and why (which sources they're cited from).

### 4.2 Competitor sourcing

Two paths:

1. **Inferred** — extend `buildClaudePrompt` in `generate.ts` to also return:
   ```json
   "competitors": [
     { "name": "...", "brandVariations": ["..."], "why": "1-line reason" }
   ]
   ```
   3–7 competitors. Add to system prompt: *"List 3–7 direct competitors that buyers in this category compare against [brand]. For each, list 2–4 brand variations as they might appear in AI responses."*

2. **Observed** — after the first scan, surface the top 10 detected brands (from Pass 2 of `extractBrandMentions`) ranked by frequency. UI lets the user pin which become tracked competitors.

Both feed into `workspaces.competitors` JSON.

### 4.3 Source-level breakdown

In `scoreResults`, add per-competitor citation rollup:

```ts
export type CompetitorBreakdown = {
  competitor: string;
  shareOfVoice: number;
  wonPrompts: string[];           // prompts where competitor appeared but subject didn't
  citedDomainsCount: Record<string, number>;  // domain → # times cited in responses mentioning this competitor
  examples: Array<{ prompt: string; engine: EngineName; snippet: string }>;
};
```

The `citedDomainsCount` answers *"when ChatGPT recommends Competitor X, what sources is it citing?"* — directly actionable.

### 4.4 UI

New page route: `/scan/[id]/competitors`. Layout:

- **Head-to-head table** — subject brand row + each competitor row. Columns: SoV %, Top-3 rate, prompts won, primary cited domains.
- **Prompts-lost view** — list of prompts where competitor X appeared and subject didn't. Click → expand to see the actual engine responses.
- **Authority sources** — for each competitor, the top 5 cited domains (their "support network"). One-click: "see what they have on this domain that you don't."

### 4.5 Acceptance criteria

- [ ] `generate.ts` outputs include `competitors` array; existing tests updated.
- [ ] Workspace can edit competitor list (add/remove/pin) via `/api/workspaces/[id]/competitors`.
- [ ] Competitor breakdown is per-scan, stored in DB, rendered on the competitors page.

---

## 5. Feature C — Brand Citation Tracking & Sentiment (Phase 3)

### 5.1 Purpose

How often is the brand cited, on which engines, in what context, and how is it described — including inaccuracy detection.

### 5.2 New module

`lib/scanner/sentiment.ts`:

```ts
export type SentimentResult = {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  confidence: number;          // 0..1
  reasoning: string;           // 1 sentence, for UI tooltip
  inaccurate: boolean;
  inaccuracyReason?: string;
};

export async function classifySentiment(input: {
  snippet: string;
  brand: string;
  brandContext: string;        // 1-2 lines about what the brand actually does (from businessProfile)
  anthropic: AnthropicClient;
}): Promise<SentimentResult>;

// Implementation: Haiku call. JSON-only response. Strict prompt requiring evidence-grounded
// sentiment + an inaccuracy check ("does this snippet describe the brand in a way that
// contradicts the brandContext?").
//
// Run 3× and majority-vote when high stakes. For v1, single-shot is fine; flag low-confidence
// (<0.6) for human review in UI.
```

Cost: ~$0.002/snippet, run only on responses where subject brand appears (~5–24 calls per scan).

### 5.3 Where it runs

After `extractBrandMentions` in `scan.ts`. For each mention where `isSubjectBrand`, queue a sentiment call. Use `Promise.all` with mild concurrency limit (8). Cache by `sha256(snippet + brand)` to avoid re-running on retries.

### 5.4 New aggregate

```ts
export type SentimentRollup = {
  overall: SentimentResult['sentiment'];     // most common
  distribution: Record<SentimentResult['sentiment'], number>;
  inaccurateCount: number;
  flaggedExamples: Array<{ prompt: string; engine: EngineName; snippet: string; reason: string }>;
  perEngine: Record<EngineName, Record<SentimentResult['sentiment'], number>>;
};
```

### 5.5 UI

- Add **Sentiment chip** on each prompt-result row in the existing per-prompt table. Colour: green/grey/red/yellow for positive/neutral/negative/mixed.
- New section "How AI describes your brand" with:
  - Sentiment distribution donut.
  - Per-engine sentiment grid.
  - **Inaccuracy flags** — prominently displayed at top of the section if any. Each card: the inaccurate claim, which engine said it, the proposed correction.

### 5.6 Acceptance criteria

- [ ] `sentiment.ts` unit-tested with mocked Anthropic client, including the inaccuracy-detection path.
- [ ] No sentiment calls fire if the subject brand never appears in a scan (saves money on invisible brands).
- [ ] Sentiment results persist to `mentions.sentiment` columns.

---

## 6. Feature E — Publication Targeting & PR Engine (Phase 4)

### 6.1 Purpose

Tell the customer: which publications LLMs cite in your category, which you have presence on, which you don't, which journalists to pitch, and what the pitch should say.

### 6.2 Citation graph

New module `lib/scanner/citations.ts`:

```ts
export type CitationGraphEntry = {
  domain: string;
  citedCount: number;
  citedByEngines: Record<EngineName, number>;
  promptsCited: string[];
  categories: Record<Category, number>;
  cooccurredBrands: Record<string, number>;
  exampleSnippets: Array<{ prompt: string; engine: EngineName; url: string; title?: string; snippet?: string }>;
  authorityScore?: number;       // DR from DataForSEO, lazy-loaded
  publicationTier?: 'tier1_press' | 'tier2_trade' | 'industry_blog' | 'community' | 'social' | 'wikipedia' | 'reference';
};

export function buildCitationGraph(scanResults: ScanResults): CitationGraphEntry[];

export async function enrichWithAuthority(
  graph: CitationGraphEntry[],
  dataforseo: DataforseoClient
): Promise<CitationGraphEntry[]>;

export function classifyPublicationTier(domain: string): CitationGraphEntry['publicationTier'];
// Heuristic + hardcoded list. Wikipedia/Britannica → reference. Reddit/Quora/StackOverflow → community.
// LinkedIn/Twitter/YouTube → social. NYT/WSJ/Forbes → tier1_press. Industry-specific TBD.
```

### 6.3 Vertical baseline data

Ship a static seed file `lib/scanner/baseline-citations.json` with the top-cited domains per vertical, scored. Vertical taxonomy aligns with `businessProfile.industry`. Sources to populate it from (one-time research, not at runtime):

- Reddit dominates general consumer queries (~40% of citations across engines).
- Wikipedia dominates ChatGPT (~26–48% of top-10 citation share).
- LinkedIn is #1 for B2B/professional queries across all six major engines.
- Listicle-format content gets ~22% of all AI citations, highest of any format.

Use the baseline to bootstrap recommendations on the very first scan — before any customer-specific citation data accumulates.

### 6.4 Presence detection

For each top-cited domain, determine if the workspace has presence:

```ts
export async function detectPresence(input: {
  domain: string;
  brand: string;
  brandVariations: string[];
  serper: SerperClient;
  dataforseo: DataforseoClient;
}): Promise<{
  presenceScore: number;            // 0..1
  pages: Array<{ url: string; title: string; type: 'mention' | 'profile' | 'authored' | 'unknown' }>;
  hasBacklink: boolean;
}>;
```

Implementation: `site:{domain} "{brand}"` via Serper for mention count, DataForSEO backlinks API for inbound links.

### 6.5 Opportunity scoring

```
opportunity_score =
  citation_frequency_in_workspace_scan
  × (1 - presence_score)
  × authority_weight
  / difficulty_score
```

Where:
- `citation_frequency_in_workspace_scan`: from `CitationGraphEntry.citedCount`.
- `presence_score`: from `detectPresence`.
- `authority_weight`: log10(DR + 1), capped at 3.
- `difficulty_score` (1..10): Wikipedia 9, top-tier press 8, niche blog guest post 3, Reddit/Quora participation 2, LinkedIn employee post 1.

Store top 20 opportunities per scan in `opportunities` table.

### 6.6 Outreach module

New module `lib/scanner/outreach.ts`:

```ts
export type Journalist = {
  name: string;
  publication: string;
  beats: string[];
  recentArticles: Array<{ url: string; title: string; publishedAt: string }>;
  contactEmail?: string;
  linkedinUrl?: string;
};

export async function findJournalists(input: {
  publication: string;
  topics: string[];
  muckrack: MuckrackClient;
  signalhire: SignalhireClient;
}): Promise<Journalist[]>;

export async function generatePitchDraft(input: {
  journalist: Journalist;
  workspace: Workspace;
  opportunity: Opportunity;
  newsHook: string;        // generated from customer's recent activity, ICP, or scan findings
  anthropic: AnthropicClient;
}): Promise<{ subject: string; body: string; reasoning: string }>;
```

Pitch generation uses the scan data as the hook ("I noticed ChatGPT cites your work on $TOPIC, and my client has $DATA_POINT that would strengthen your next piece"). Output should always be a draft for human review, never auto-sent.

### 6.7 Community surfaces

For non-traditional citation sources (Reddit, Quora, YouTube), `outreach.ts` exposes:

```ts
export async function findCommunityOpportunities(input: {
  domain: 'reddit.com' | 'quora.com' | 'youtube.com' | 'stackoverflow.com';
  topics: string[];
  brand: string;
  serper: SerperClient;
}): Promise<CommunityOpportunity[]>;

// For Reddit: identify subreddits already cited by LLMs in scan, surface relevant active
// threads, check sidebar rules for self-promo policy, score by recent activity.
// For Quora: identify question pages cited in scan, score by view count and answer-staleness.
// For YouTube: identify cited channels, surface their recent uploads, check for topical gaps.
```

### 6.8 API routes

- `POST /api/opportunities/generate` — runs the whole pipeline for a workspace; writes to `opportunities` table.
- `GET /api/opportunities?workspace_id=...` — paginated list.
- `POST /api/opportunities/[id]/find-journalists` — heavier call, runs on demand.
- `POST /api/opportunities/[id]/pitch` — generates pitch draft.
- `POST /api/interventions` — customer logs that they acted on an opportunity (for attribution).

All paid-tier; rate-limited per workspace, not per IP.

### 6.9 UI

New page: `/workspace/[id]/publications`. Layout:

- **Hero metric**: "AI cites these 28 publications in your category. You have presence on 6."
- **Publication grid** — cards sorted by `opportunity_score`. Each card:
  - Domain logo + name
  - Citation frequency badge
  - Presence indicator (none / mention / profile / authored)
  - Authority score (DR)
  - Difficulty pill
  - "View opportunity" button
- **Opportunity detail drawer** (slide-in from right):
  - The exact prompts where this publication is cited
  - Sample LLM responses showing the citations
  - Suggested action ("write a guest post", "comment on this Reddit thread", "Wikipedia edit")
  - "Find journalists" button → loads journalist list
  - Per-journalist: name, beat, recent articles, "Generate pitch" button
  - Pitch draft editor with copy-to-clipboard
- **Filter sidebar**: by tier (press / trade / community / reference), by presence (have / don't have), by category (informational / discovery / etc.).

### 6.10 Acceptance criteria

- [ ] Citation graph built correctly for a fixture scan with 4 engines × 24 prompts × N citations.
- [ ] Vertical baseline seed file present and merged with scan data.
- [ ] Authority enrichment hits DataForSEO once per unique domain, cached for 30 days.
- [ ] Pitch drafts never include autosend logic; UI explicitly says "draft — review before sending".
- [ ] Community opportunities respect rate limits on Reddit/Quora APIs.

---

## 7. Feature F — Search Intelligence & Query Landscape (Phase 5)

### 7.1 Purpose

Map the customer's keyword universe across Google + Bing, the surrounding cross-channel demand (Reddit/Quora/YouTube/PAA), and the competitive SERP landscape — then tie it back to the AI prompts so the customer sees the *demand vs AI visibility* picture in one place.

### 7.2 Keyword universe builder

New module `lib/scanner/keywords-intel.ts` (rename existing `/api/scan/keywords` route logic into here):

```ts
export type KeywordUniverseInput = {
  workspace: Workspace;
  prompts: FlatPrompt[];
  locationCode: number;        // DataForSEO format; default to 2840 (US) or 2356 (India) per workspace
  languageCode: string;        // 'en'
  anthropic: AnthropicClient;
  dataforseo: DataforseoClient;
};

export async function buildKeywordUniverse(input: KeywordUniverseInput): Promise<KeywordUniverse>;

// Pipeline:
// 1. For each prompt, ask Claude to derive 3-5 underlying keyword queries (the head terms a
//    buyer would Google). Tag each keyword with the prompt it came from + intent stage.
// 2. Dedupe across prompts.
// 3. Hit DataForSEO relatedKeywords on the top 20 seeds → expand to ~150 keywords.
// 4. Hit DataForSEO searchVolume + bingSearchVolume for the full set (batched).
// 5. Hit googleTrends for the top 50 by volume to get 12-month trend.
// 6. For each keyword, flag whether AI Overview is present in the SERP.
// 7. Persist to keyword_universes + keyword_entries.
```

### 7.3 SERP position capture

```ts
export async function captureSerpPositions(input: {
  universe: KeywordUniverse;
  workspace: Workspace;
  locationCode: number;
  dataforseo: DataforseoClient;
}): Promise<void>;

// For each keyword_entry, hit serpOrganic, write a serp_snapshots row with positions JSON.
// Tag each position as: 'subject' (workspace domain), 'competitor' (matches competitors list),
// 'cited_pub' (matches citation graph), 'other'.
```

Run captureSerpPositions once at scan time; rerun weekly via cron for paid workspaces.

### 7.4 Cross-channel demand

```ts
export type CrossChannelDemand = {
  query: string;
  google: number;
  bing: number;
  redditThreads: number;
  quoraQuestions: number;
  youtubeTopVideoViews: number | null;
  paa: string[];
  totalDemandSurface: number;     // weighted sum
};

export async function fetchCrossChannelDemand(
  query: string,
  serper: SerperClient
): Promise<CrossChannelDemand>;

// Reddit/Quora counts via Serper site-restricted queries.
// YouTube via YouTube Data API search.list (or Serper YouTube tab).
```

### 7.5 Strategy map (the killer view)

```ts
export type StrategyQuadrant = {
  perPromptCategory: Record<Category, {
    totalDemand: number;
    aiAppearanceRate: number;
    bucket: 'defend' | 'fix_urgent' | 'sustaining' | 'deprioritise';
  }>;
  perPrompt: Array<{
    prompt: string;
    category: Category;
    demand: number;
    aiAppearanceRate: number;
    bucket: 'defend' | 'fix_urgent' | 'sustaining' | 'deprioritise';
    underlyingKeywords: string[];
  }>;
};
```

Buckets defined by quadrant split on median demand × median AI appearance rate.

### 7.6 API routes

- `POST /api/keywords/universe/build` — builds the universe, returns the ID.
- `GET /api/keywords/universe/[id]` — paginated keyword entries with positions.
- `POST /api/keywords/serp-refresh` — re-captures SERP positions.
- `GET /api/keywords/strategy-map?workspace_id=...&scan_id=...`

### 7.7 UI

New page: `/workspace/[id]/keywords`. Layout:

- **Filter bar**: location, intent stage, AI Overview presence, owned-rank-status (we rank / competitor ranks / nobody ranks).
- **Keyword table** (virtualised, sortable): query, Google vol, Bing vol, trend sparkline, your rank, top competitor rank, AI Overview badge, linked AI prompts.
- **Row expand**: SERP position history graph, cross-channel demand breakdown, top 3 ranking URLs.

New page: `/workspace/[id]/strategy`. Layout:

- **Quadrant chart**: X = demand surface, Y = AI appearance rate. Dots = individual prompts. Hover = detail card. Click = drill-in.
- **Per-category strip**: 4 horizontal cards (informational / discovery / commercial / transactional) each showing bucket distribution.
- **Recommended priorities list**: prompts in "fix_urgent" sorted by demand × intent-value weight.

### 7.8 Acceptance criteria

- [ ] Universe build for a 24-prompt scan produces ~100–200 keywords with non-null volumes.
- [ ] SERP capture stores ≥10 positions per keyword in `serp_snapshots`.
- [ ] Strategy map quadrant assignment is deterministic and reproducible from stored data.
- [ ] Cross-channel demand surfaces meaningful Reddit/Quora counts for at least 80% of keywords.

---

## 8. Feature D — AI Content Recommendations (Phase 6)

### 8.1 Purpose

For each significant visibility gap, produce a content brief grounded in: the failed prompts, the competitor citation sources, the underlying keywords, and the structural patterns LLMs reward.

### 8.2 New module

`lib/scanner/briefs.ts`:

```ts
export type ContentBrief = {
  workspaceId: string;
  opportunityId: string;
  title: string;
  targetQueries: KeywordEntry[];
  targetPrompts: string[];
  estimatedDemandSurface: number;
  competitorReference: Array<{ competitor: string; url: string; whyItWins: string }>;
  brief: {
    angle: string;
    definitionFirstOpener: string;   // <80 words, drop-in
    requiredSections: Array<{ heading: string; mustInclude: string[]; targetWordCount: number }>;
    requiredStats: string[];         // info density signals
    requiredSchema: Array<'FAQPage' | 'HowTo' | 'Article' | 'Product' | 'Review'>;
    formatHints: string[];           // 'listicle', 'comparison table', 'step-by-step'
    internalLinksTo: string[];
    externalCitationsTo: string[];
  };
  publicationTarget: { domain: string; reason: string };
  scoringRubric: {
    definitionFirst: boolean;
    informationDensity: number;      // entities + stats per 100 words target
    structuredMarkup: boolean;
    listicleFormat: boolean;
    freshnessRequired: boolean;
  };
};

export async function generateBrief(input: {
  opportunity: Opportunity;
  scanResults: ScanResults;
  citationGraph: CitationGraphEntry[];
  universe: KeywordUniverse;
  workspace: Workspace;
  anthropic: AnthropicClient;
}): Promise<ContentBrief>;
```

### 8.3 Brief construction rules

Bake into the Claude prompt as hard constraints, derived from current GEO research:

1. **Definition-first opener**: first paragraph ≤80 words, leads with a one-sentence definition.
2. **Information density**: at least 1 named entity + 1 quantitative claim per paragraph.
3. **Structured markup**: at least one of FAQPage / HowTo / Article schema required.
4. **Listicle/comparison formats prioritised** for transactional and commercial categories.
5. **Freshness**: target a publish date and require quarterly refresh schedule.
6. **Cross-platform breadcrumbs**: brief includes one Reddit/Quora hook (a thread or question the content should be designed to be cited from later).

### 8.4 UI

New page: `/workspace/[id]/briefs`. Layout:

- **Brief grid**: cards by opportunity, sortable by demand × difficulty.
- **Brief detail view**: full markdown brief rendered, "Copy to clipboard", "Export as .docx", "Mark as published" (creates an `interventions` row).
- **Scoring rubric checklist**: live, lets the customer paste their draft content and get a heuristic score against the rubric before they publish.

### 8.5 Acceptance criteria

- [ ] Brief for a sample opportunity contains all required-section + scoring-rubric fields.
- [ ] "Export as .docx" produces a clean document using the existing `docx` skill conventions.
- [ ] Marking a brief published creates a tracked intervention for later attribution.

---

## 9. Feature G — Validation Framework (Phase 7)

### 9.1 Purpose

Quantify LLM-response variance, characterise stability per prompt, and prove that interventions caused measurable visibility lift.

### 9.2 Multi-run sampling

Modify `runScan` to accept `runCount: number` (default 1 for free tier, 3–5 for paid). For each run, create a `scan_runs` row and N × all prompts × all engines.

New aggregate:

```ts
export type StabilityScore = {
  perPrompt: Array<{
    prompt: string;
    runs: number;
    appearanceRate: number;       // appeared in K of N runs (per-engine averaged)
    positionStdDev: number | null;
    stable: boolean;              // appearanceRate === 0 || appearanceRate === 1
    confidenceInterval: [number, number];  // Wilson score interval on appearance rate
  }>;
  overallStability: number;       // mean of perPrompt
};
```

Display in UI: every appearance flag is annotated with run-count and stability. UI explicitly says "you appeared in 2 of 3 runs — moderately stable".

### 9.3 Golden dataset for `extractBrandMentions`

`tests/golden/brand-extraction.json` — 50–100 hand-labelled (response_text, expected_mentions) pairs covering:

- ASCII-only brands
- Brands with punctuation (`O.co`, `Yahoo!`)
- Multilingual casing (`boAt`, `eco365`)
- Hyphenated / spaced variants (`clever-tap`, `Clever Tap`)
- Negative cases ("Notion" inside "Notional")
- List-context vs prose
- Multiple brands in one response

`tests/unit/brand-golden.test.ts` runs `extractBrandMentions` against all fixtures and asserts precision + recall ≥ 0.95.

### 9.4 Before/after attribution

```ts
export async function computeLift(input: {
  workspaceId: string;
  baselineScanIds: string[];      // pre-intervention
  postScanIds: string[];          // post-intervention
  intervention: Intervention;
}): Promise<{
  perPrompt: Array<{
    prompt: string;
    baselineMean: number;
    baselineStdDev: number;
    postMean: number;
    delta: number;
    deltaSigma: number;            // |delta| / baselineStdDev
    pValue: number;                // Mann-Whitney U or paired t
    claimable: boolean;            // deltaSigma >= 2 AND pValue < 0.05
  }>;
  overall: {
    appearanceLift: number;
    sigmaWeightedLift: number;
    pValue: number;
    claimable: boolean;
  };
  counterfactual: {
    controlPrompts: string[];
    controlDrift: number;          // if control prompts also drifted up, lift is suspect
  };
}>;
```

Surface in UI as: *"After publishing your brief on Domain X, your appearance rate on [these 4 prompts] went from 0.2 to 0.8. Lift is 6.2σ over baseline variance. p<0.001. Counterfactual control prompts drifted 0.05. **Attribution is highly likely.**"*

### 9.5 Drift detector (cron)

`app/api/cron/drift-detection/route.ts` (Vercel cron):

- Runs daily.
- For each active workspace, computes a fresh single-run scan.
- Compares against rolling baseline (last 14 days).
- Triggers `drift_alerts` row if appearance rate or share of voice drops > 2σ, sentiment shifts negative, or a competitor surges +2σ.
- Sends email/Slack via Resend + Slack webhook if `workspaces.alerts_enabled`.

Protect with `CRON_SECRET` header.

### 9.6 Acceptance criteria

- [ ] Paid-tier scan with N=3 runs persists three `scan_runs` rows and computes stability scores.
- [ ] Golden brand-extraction test runs in CI with precision/recall thresholds.
- [ ] `computeLift` unit-tested against synthetic baseline/post fixtures with known sigma deltas.
- [ ] Cron endpoint protected, idempotent, and observable (logs to Supabase `cron_runs` table).

---

## 10. Free vs paid tier boundaries

| Capability | Free | Paid |
|---|---|---|
| Single scan, 24 prompts × 4 engines | ✅ | ✅ |
| Share of Voice (own brand only) | ✅ | ✅ |
| Competitor benchmarking | ❌ (first competitor unlocked, rest gated) | ✅ |
| Sentiment + inaccuracy detection | ❌ | ✅ |
| Citation graph (your category) | partial preview | ✅ |
| Publication targeting & PR | ❌ | ✅ |
| Search intelligence + SERP positions | ❌ | ✅ |
| Strategy map | ❌ | ✅ |
| Content briefs | ❌ | ✅ |
| Multi-run stability scoring | ❌ | ✅ |
| Drift detection + alerting | ❌ | ✅ |
| Lift attribution | ❌ | ✅ |
| Email capture wall after free scan | ✅ | ✅ |

Free scan retains its current 3-scans-per-IP-per-day rate limit. Paid scans are workspace-scoped, no IP limit, but quota per plan tier (e.g. Starter 50/mo, Growth 250/mo, Pro unlimited).

---

## 11. UI design system

### 11.1 Stack

Continue with Next.js App Router + React + Tailwind. Adopt **shadcn/ui** primitives for all new components (Button, Card, Dialog, Tabs, Table, Sheet, Tooltip, Toast, Select, Combobox, etc.) — install via `npx shadcn@latest add ...`. Charts via **Recharts**. Icons via **lucide-react**.

### 11.2 Design tokens

Add to `tailwind.config.ts`:

```ts
// Colour palette — clean SaaS, slightly warm, high contrast
// Primary: indigo-600 (#4f46e5)
// Accent: emerald-500 (#10b981) for positive deltas
// Warning: amber-500 for stability flags
// Danger: rose-500 for sentiment negative + drift drops
// Neutrals: zinc scale (zinc-50 backgrounds, zinc-900 text, zinc-200 borders)
// Subject brand colour: always the primary indigo
// Competitor colours: distinct hues from a fixed 8-colour palette (no random hashes)
```

Typography:
- Display: `font-sans` (Inter via `next/font/google`) at `text-4xl` to `text-6xl` for hero metrics.
- Body: Inter at `text-sm` to `text-base`.
- Mono: JetBrains Mono for prompts, brand variations, JSON previews.

Spacing: stick to Tailwind's 4px grid. Card padding `p-6`, page padding `px-8 py-6`, gap between cards `gap-6`.

Border radius: `rounded-lg` (8px) default, `rounded-2xl` (16px) for hero cards.

Shadows: `shadow-sm` default; never larger than `shadow-md` — too SaaS-marketing-y.

### 11.3 Layout architecture

Top-level app shell once authed:

```
┌────────────────────────────────────────────────────┐
│ Top bar: workspace switcher · scan trigger · user  │
├──────────┬─────────────────────────────────────────┤
│ Sidebar  │ Main content                            │
│          │                                         │
│ Overview │                                         │
│ Scans    │                                         │
│ Compet.  │                                         │
│ Publics. │                                         │
│ Keywords │                                         │
│ Strategy │                                         │
│ Briefs   │                                         │
│ Alerts   │                                         │
│ Settings │                                         │
└──────────┴─────────────────────────────────────────┘
```

Sidebar collapses on mobile (sheet). Use `lucide-react` icons. Keep label width tight.

### 11.4 Page-by-page

**`/` (Landing — existing)** — keep current design; add a `<TestimonialStrip />` and `<PricingPreview />` below the fold. Do not over-decorate; the demo scan is the hero.

**`/scan/[id]` (Existing — extend)** — current sections stay. New sections added beneath in this order:
1. Share of Voice (Feature A)
2. Sentiment summary (Feature C) — appears only if subject brand appeared in ≥1 response.
3. Citation graph preview (Feature E) — top 5 cited domains, "see all" CTA.
4. Search intelligence preview (Feature F) — top 5 underlying keywords with volumes, "see all" CTA.
5. Existing email-capture wall comes last and now also offers "Sign up to unlock full report".

**`/dashboard` (New)** — workspace overview. Three rows:
- Hero stat row: AI Visibility Score (big), SoV %, Top-3 rate, Stability.
- Trend row: 30-day appearance-rate line chart (subject) + per-competitor lines (toggleable).
- Action row: top 3 opportunities, top 3 alerts, last scan timestamp.

**`/workspace/[id]/competitors` (New — Feature B)** — head-to-head table + prompts-lost view + authority sources.

**`/workspace/[id]/publications` (New — Feature E)** — publication grid + opportunity drawer + journalist + pitch.

**`/workspace/[id]/keywords` (New — Feature F)** — keyword table + filter bar + row expand.

**`/workspace/[id]/strategy` (New — Feature F)** — quadrant chart + per-category strip + priority list.

**`/workspace/[id]/briefs` (New — Feature D)** — brief grid + brief detail + export.

**`/workspace/[id]/alerts` (New — Feature G)** — alert feed with acknowledge/dismiss; expanded view per alert showing the metric drift chart.

**`/workspace/[id]/settings`** — workspace name, primary domain, competitors editor, alert preferences, billing.

### 11.5 Component library (new components to build)

Under `components/`:

- `components/ui/*` — shadcn primitives.
- `components/charts/AppearanceRateChart.tsx` — line chart, multi-series.
- `components/charts/ShareOfVoiceBar.tsx` — stacked horizontal bar.
- `components/charts/QuadrantChart.tsx` — scatter on demand × visibility axes.
- `components/charts/SentimentDonut.tsx` — three-segment donut.
- `components/charts/TrendSparkline.tsx` — tiny inline sparkline for table cells.
- `components/scanner/BrandMentionMatrix.tsx` — categories × brands grid.
- `components/scanner/CompetitorHeadToHead.tsx` — pinnable rows table.
- `components/publications/PublicationCard.tsx`, `PublicationDetailDrawer.tsx`, `JournalistList.tsx`, `PitchDraftEditor.tsx`.
- `components/keywords/KeywordTable.tsx` (virtualised via `@tanstack/react-virtual`).
- `components/keywords/CrossChannelDemandPanel.tsx`.
- `components/briefs/BriefCard.tsx`, `BriefDetail.tsx`, `RubricChecklist.tsx`.
- `components/alerts/AlertCard.tsx`, `AlertDriftChart.tsx`.
- `components/shared/StabilityBadge.tsx` — small badge: "2/3 runs · stable" / "1/3 runs · noisy".
- `components/shared/InaccuracyFlag.tsx` — high-visibility callout.
- `components/shared/EngineLogo.tsx` — uniform 24x24 logo per engine.

### 11.6 Interaction principles

- **Empty states must be useful**, not decorative. Every empty state has a clear next action ("Run your first scan", "Add competitors to unlock", etc.).
- **Loading states** use skeletons matching the final layout shape, not generic spinners. Existing `ScanningAnimation` for the scan flow stays.
- **All drawers and dialogs** use `Sheet` (right slide-in) for opportunity / brief detail; `Dialog` (centred) for confirmations and short forms.
- **All tables** support: column sort, column resize, sticky header, row expand. Use `@tanstack/react-table`.
- **All money/effort estimates** show ranges, never single numbers.
- **All "AI said this" attributions** show the engine name + snippet on hover.

### 11.7 Accessibility

- WCAG AA contrast minimum on all text and interactive elements.
- Every chart has a screen-reader-accessible table fallback.
- All interactive elements keyboard-reachable; focus rings preserved (`focus-visible:ring-2`).
- Colour is never the only signal — pair with icon or label.

### 11.8 Mobile

Sidebar collapses to a slide-over sheet. Tables become card-list views below `md` breakpoint. Charts retain readability; sparklines and donuts work well, large multi-line trend charts get a "view full" CTA.

---

## 12. Testing strategy

| Layer | Approach |
|---|---|
| `lib/scanner/*` modules | Unit tests in `tests/unit/`, dependency-injected mocks. Aim ≥90% line coverage. |
| Engine integration | Live tests in `tests/integration/*.live.test.ts` guarded by `RUN_LIVE_TESTS=true`. Already established pattern; extend for new fields (citations). |
| DataForSEO integration | Mock `fetch` for unit tests; one live test for SERP and one for search volume. |
| API routes | Route handler tests in `tests/api/` using `NextRequest`/`NextResponse` fixtures. Verify rate-limit application, auth, request shape. |
| Database | Migration tests via `supabase db reset` in CI. RLS policy tests per table. |
| UI components | Storybook (optional but recommended). Per-component visual stories for Card, Drawer, Chart, etc. Snapshot tests for the table render with fixture data. |
| End-to-end | Playwright suite: free scan flow, signup, paid scan, opportunity drill-down, brief generation. Run on PR. |
| Validation framework | Golden datasets in `tests/golden/`. CI thresholds: brand extraction precision ≥0.95, sentiment classification accuracy ≥0.85 against hand-labelled set. |

CI: GitHub Actions. Pipeline: `lint → typecheck → unit → integration (skipped unless flag) → db-migration → build`. PR comment with coverage delta.

---

## 13. Observability

- Server logs structured (pino), one log line per API request with workspace_id, route, status, duration_ms.
- Errors to Sentry. Tag with workspace_id, engine, route.
- Track `tokens_used` and `external_api_cost_cents` per scan in a `scan_costs` table. Surface per-workspace cost in admin panel; needed for paid-tier margin tracking.
- Datadog or Grafana dashboard (optional v2): scan throughput, p95 latency per engine, citation extraction success rate per engine, drift alert volume.

---

## 14. Open questions / decisions Rahul should make

1. **Vertical taxonomy**: should we adopt a standard (e.g. G2's category tree, ~1,500 categories) or a shorter custom one (~50)? Shorter is faster to ship; longer is more accurate for baseline citation tables.
2. **Pricing tiers**: where should the paid wall sit? Recommend Starter $99/mo (5 workspaces, 50 scans), Growth $299/mo (15 workspaces, 250 scans, alerts), Pro $999/mo (unlimited + lift attribution + multi-run stability).
3. **Locale defaults**: should the free scan auto-detect country from IP and run in that locale, or default to US for consistency? Recommend IP-based with override.
4. **Wikipedia opportunity**: should we surface it as an action item, given its difficulty? Recommend yes, with a clear "long-term play" badge and links to Wikipedia notability guidelines.
5. **Self-hosting vs Supabase**: stay on Supabase for v1; revisit if/when costs cross $2k/mo.
6. **PR module**: Muckrack pricing is steep. Alternative: build a lightweight scraper around `serper.dev` + LinkedIn + public bylines. Recommend starting with the lightweight approach and integrating Muckrack only for enterprise tier.

---

## 15. Glossary

- **GEO** — Generative Engine Optimization. The discipline of making a brand more cited in AI-generated answers.
- **SoV** — Share of Voice. Brand's mentions / total brand mentions in a sample.
- **Top-3 rate** — % of responses where the brand is in the first 3 distinct brand mentions.
- **Citation graph** — domain-level rollup of which publications LLM responses ground on in a given category.
- **Stability** — fraction of repeated runs in which a brand appears for the same prompt; proxy for response reliability.
- **Lift** — measured change in appearance rate or SoV between baseline and post-intervention periods, with statistical attribution.
- **Demand surface** — sum of search volume across Google + Bing + Reddit threads + Quora questions + YouTube views, per query.
- **Drift** — unprompted regression in appearance rate, SoV, or sentiment, exceeding 2σ of baseline.

---

*End of spec. Companion files to maintain alongside this doc: `docs/architecture.md` (existing), `docs/api-contracts.md` (to be created in Phase 1), `docs/db-schema.md` (auto-generated from migrations).*