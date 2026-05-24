# sparrwo

Know where your brand lives in AI search.

sparrwo scans ChatGPT, Gemini, Claude & Perplexity to show exactly where buyers find — or miss — your brand.

## What it does

When a B2B buyer asks an AI chatbot to recommend tools in your category, does your name come up? sparrwo answers that question by running 24 real buyer-intent prompts across 4 AI engines and returning a visibility score broken down by intent stage.

- **4 AI engines** — ChatGPT, Gemini, Claude, Perplexity
- **24 buyer prompts** — mapped to informational, discovery, commercial, and transactional intent
- **ICP-aware** — prompts are generated from your actual website, targeting your specific buyer profile
- **Free scan** — no signup required

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth + database)
- Claude API (prompt generation)
- OpenAI API (ChatGPT scanning)
- Perplexity API
- Google Gemini API
- Resend (email)
- Stripe (payments)
- Vercel (hosting)

## Getting started

```bash
npm install
cp .env.example .env.local   # add your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
PERPLEXITY_API_KEY=
GEMINI_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Testing the agents

The scanner agents (Claude prompt-gen + 4 engine scanners) live in [`lib/scanner/`](lib/scanner/) and are tested via Vitest.

```bash
npm test               # all unit tests + skipped live tests
npm run test:watch     # watch mode for unit tests
npm run test:unit      # unit tests only
npm run test:live      # live integration tests against the real APIs
npm run test:live:claude       # one engine at a time
npm run test:live:openai
npm run test:live:gemini
npm run test:live:perplexity
```

**Unit tests** (`tests/unit/`) mock the Anthropic SDK and `fetch`, so they run offline and need no keys.

**Live integration tests** (`tests/integration/*.live.test.ts`) hit the real APIs. Each suite skips itself unless:
- `RUN_LIVE_TESTS=true`, AND
- the matching API key is present in [`.env.local`](.env.local) (and is not a `placeholder-*` value).

The full pipeline test (`pipeline.live.test.ts`) generates an ICP for `TEST_DOMAIN` (default `vercel.com`) and runs 1 prompt per category against every available engine. Override with `TEST_DOMAIN=yourdomain.com npm run test:live`.

### Architecture

| Module | Responsibility |
|---|---|
| [`lib/scanner/types.ts`](lib/scanner/types.ts) | Shared types (`Category`, `BusinessProfile`, `Icp`, `ScanResults`, etc.) |
| [`lib/scanner/parse.ts`](lib/scanner/parse.ts) | `stripCodeFences`, `cleanCompanyName` |
| [`lib/scanner/brand.ts`](lib/scanner/brand.ts) | `extractBrandVariations`, `detectBrand`, `extractSnippet` |
| [`lib/scanner/domain.ts`](lib/scanner/domain.ts) | `normalizeDomain`, `getWebsiteData` (3-URL fallback) |
| [`lib/scanner/rate-limit.ts`](lib/scanner/rate-limit.ts) | `createRateLimiter` factory |
| [`lib/scanner/engines.ts`](lib/scanner/engines.ts) | `queryClaude`, `queryOpenAI`, `queryGemini`, `queryPerplexity` — each takes `(prompt, apiKey)` and returns raw text |
| [`lib/scanner/generate.ts`](lib/scanner/generate.ts) | `generateIcpForDomain` — dependency-injected agent: pass a fake `anthropic` client in tests |
| [`lib/scanner/scan.ts`](lib/scanner/scan.ts) | `runScan` — orchestrates 4 engines in parallel, scores results |

Routes in `app/api/scan/*` are thin wrappers over these modules.
