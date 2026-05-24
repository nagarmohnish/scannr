# sparrwo — Product Document

> **Status**: working draft, post-pivot from "AI visibility scanner" to "integrated traffic intelligence + monetization platform."
> **Audience**: founders, investors, early hires, design partners.
> **Companion docs**: [ARCHITECTURE.md](./ARCHITECTURE.md) (how the code works), [ROADMAP.md](./ROADMAP.md) (what ships when).

---

## 1. One-line pitch

**sparrwo is the operating system for a brand's discovery surface — the closed loop from how AI models describe you, to how that translates into traffic, to how that traffic gets monetized.**

For modern brands, "being findable" no longer ends at Google rankings. It starts there and extends through ChatGPT recommendations, Perplexity citations, Reddit threads, LinkedIn shares, and every other surface where a buyer encounters your category. sparrwo measures, optimizes, and monetizes that entire surface in one product.

---

## 2. The problem

### 2.1 What broke
Three tectonic shifts happened in 24 months and most B2B/DTC brands have no tooling for any of them:

1. **AI search ate the top of the funnel.** ChatGPT crossed 600M weekly users; Google AI Overviews cover the majority of commercial queries; Perplexity, Claude, and Gemini collectively own a fast-growing slice of "research" intent that used to land on organic SERPs. By 2027, IDC estimates 50%+ of commercial discovery queries will be answered by an AI rather than a search result list. Brands that don't appear in AI answers are simply absent for that subset of buyers — and the subset is growing.
2. **Traditional SEO tools went blind.** Ahrefs, Semrush, Moz, ContentKing, and the entire SEO category measure rank-on-keyword. They do not measure whether your brand surfaces in a generative answer. They do not measure citation sources in those answers. They do not measure sentiment. Even the new entrants (Profound, AthenaHQ, Otterly, Peec) measure visibility but not what to do about it — and none connect visibility to traffic to revenue.
3. **Monetization is fragmented across 10 vendors.** A brand running display ads uses one SSP wrapper; programmatic native runs through a separate stack; affiliate is yet another platform; sponsored content lives in a CRM; newsletter sponsorship is a manual sales motion. Yield optimization is done in spreadsheets quarterly. There is no system that asks "given who's actually visiting me and what they intend, what's the highest-yield way to monetize them?"

### 2.2 The visible symptoms

- *"Our G2 page is incomplete and we don't know which competitors get cited instead of us."*
- *"Our blog gets 30k visits but our pricing page conversion is 1.2% — we don't know which traffic to optimize for."*
- *"AdOps reports a $6.40 eCPM. Industry benchmark is $9.80. Nobody owns finding that $3.40."*
- *"We're spending on PR but can't show the CMO if it moved AI visibility, traffic, or revenue."*

### 2.3 The deeper problem
Every brand needs four things — **be visible**, **understand who shows up**, **convert them**, **monetize them**. The market has 40 tools for the four jobs, no tool that connects them. Decisions made without that integration are guesses. sparrwo is the integration.

---

## 3. The market

### 3.1 Adjacent market sizes (2025)

| Market | Size (global, 2025) | CAGR | Source / range |
|---|---|---|---|
| SEO software | $90B | 14% | Multiple analyst estimates |
| AI visibility / GEO tooling | $300M | 80%+ | Early-stage; emerging |
| Web analytics (incl. GA4) | $9B | 13% | Gartner |
| AdOps / Yield management | $4.5B | 9% | Programmatic IO segment |
| Content marketing tooling | $25B | 16% | Includes briefs + CMS |
| **Combined surface (TAM proxy)** | **~$130B** | **~14% blended** | sparrwo addressable surface |

### 3.2 Who's spending today
- ~95,000 B2B SaaS companies globally with $1M+ ARR.
- ~250,000 DTC brands doing $500k+ revenue.
- ~12,000 large publishers running display+native monetization.
- ~5,000 enterprise marketing teams with dedicated PR + content + AdOps roles.

Even capturing 1% of the SaaS + DTC long-tail at our Growth plan price gives us a >$100M ARR opportunity.

### 3.3 Why now
- **AI search adoption hockey-sticked in 2024.** Brands that 18 months ago dismissed "ChatGPT search" now have boardroom mandates to track and respond to it.
- **Cookieless attribution** has forced every marketing team to rebuild measurement. GA4's strict event model has accidentally made every web property data-rich and decision-poor — the exact gap sparrwo fills.
- **Programmatic advertising's "supply path" rebuilds** (SSP wrappers, Prebid 9, server-side bidding) coincide with brand consolidation budgets — yield optimization is back at the top of the AdOps agenda.
- **First-party data primacy.** GA4 + 1P data is now the source of truth. A product that fuses GA4 + AI visibility + monetization signals into one workflow becomes the brand's analytics layer of record.

---

## 4. Our solution

### 4.1 The closed loop
```
                ┌─ AI visibility scan
                │   (24 buyer-intent prompts × 4 engines)
                ▼
        Find the gaps   ◀──────┐
                │              │
                ▼              │
        Find the sources       │
        (citation graph)       │
                │              │
                ▼              │
        Find the journalists   │
        + publications         │
                │              │
                ▼              │
        Match to keyword       │
        universe (Google+Bing) │
                │              │
                ▼              │
        Generate content +     │   Feedback loop:
        PR briefs              │   measure lift,
                │              │   refresh, repeat
                ▼              │
        Publish / pitch        │
                │              │
                ▼              │
        Drive traffic          │
        (GA4 sources)          │
                │              │
                ▼              │
        Classify intent +      │
        bucket users           │
                │              │
                ▼              │
        Monetize visitor       │
        (yield + AdOps + ──────┘
        partnerships)
```

This loop is the product. Every other tool implements one or two links of it. sparrwo implements all of them under one workspace.

### 4.2 The unfair advantage
Each step *feeds the next*. A keyword universe built from the gaps in your AI visibility scan is more relevant than a generic Ahrefs keyword pull. A content brief informed by which publications LLMs already cite for you is more likely to actually rank and be cited. A monetization plan informed by which traffic sources convert your highest-intent users is more profitable than a flat eCPM benchmark. Each link is more valuable inside the loop than it would be standing alone.

---

## 5. Features

### 5.1 Core (live or in active build)

| Module | What it does | Status |
|---|---|---|
| **AI Visibility Scanner** | 24 buyer-intent prompts × 4 engines (ChatGPT, Claude, Gemini, Perplexity). Scores per engine, per intent stage, with prompt-level breakdown. | Live |
| **ICP + Brand profile** | Claude infers ideal customer profile + brand variations from your website. Powers every downstream module. | Live |
| **Brand detection (alphanumeric)** | Robust matching that handles `CleverTap` / `Clever Tap` / `clevertap` / `C.l.e.v.e.r.T.a.p`. | Live |
| **Per-prompt drill-down** | Full response snippets per engine per prompt. | Live (stub UI) |

### 5.2 Intelligence layer (Phase 2-5)

| Module | What it does |
|---|---|
| **Share of Voice** | Tracks every brand mentioned across the prompt set, your share, position, top-3 appearance rate. |
| **Competitor Benchmarking** | Head-to-head: SoV, prompts lost, authority sources backing each competitor. Inferred + pinned competitors. |
| **Citation Tracking + Sentiment** | Domain-level rollup of citations per engine + Claude Haiku-driven sentiment with inaccuracy detection. |
| **Publication Targeting + PR Engine** | Top sources LLMs ground on, your presence on each, opportunity scoring, journalist discovery (Muckrack/Signalhire), pitch drafts. |
| **Keyword Universe + Strategy Map** | DataForSEO-powered keyword research tied back to AI prompts. Demand × visibility quadrant chart shows where to defend, fix, sustain, or deprioritize. |
| **Cross-Channel Demand** | Reddit threads + Quora questions + YouTube views + Google PAA per query — the *true* demand surface. |

### 5.3 Activation layer (Phase 6-7)

| Module | What it does |
|---|---|
| **AI Content Recommendations** | Publish-ready briefs grounded in failed prompts, competitor sources, and the GEO signals LLMs reward (definition-first openers, information density, structured markup, listicle/comparison formats). |
| **Validation Framework** | Multi-run stability scoring + before/after lift attribution. *"After publishing brief X, appearance rate on these 4 prompts went 0.2 → 0.8 (6.2σ over baseline)."* |
| **Drift Detection** | Daily cron compares today's scan against rolling baseline; alerts on appearance-rate drops, sentiment shifts, or competitor surges > 2σ. |

### 5.4 Traffic intelligence (NEW — Phase 1.5)

| Module | What it does |
|---|---|
| **GA4 Source Breakdown** | Every traffic source grouped by AI / search / social / direct, with sessions, conversion rate, duration, bounce. |
| **AI Referral Tracking** | First-class treatment of ChatGPT / Perplexity / Gemini / Claude / Copilot referrals (and the UTM-tagged citations we recommend you use). |
| **Intent Classification** | Each session bucketed informational / discovery / commercial / transactional from landing page + referrer keywords — same taxonomy as the scan. |
| **Optimization Recommendations** | Cross-references scan, citations, GA4 behavior, and CWV data into prioritized actions across Content, PR, Tech, UI, and Geo/SEO. |
| **Top Landing Pages × AI share** | Which pages get the most AI-referred traffic, and how they convert. |

### 5.5 Monetization (NEW — Phase 4.5)

| Module | What it does |
|---|---|
| **Yield Dashboard** | Fill rate, eCPM, revenue per channel: display, native, sponsored content, affiliate, newsletter sponsorship. |
| **Yield Headroom** | Industry benchmarks vs. your actuals, surfaced as $-quantified opportunities ("Switch wrapper to Prebid 9: +$3.4k/mo"). |
| **AI Yield Premium** | Per-engine eCPM and conversion lift — direct deal pricing for the high-intent traffic AI engines drive. |
| **Partner Matching** | Brands whose audience overlaps yours, ranked by ICP fit. Surface warm-intro paths. |
| **Sponsored AI Mentions** | As OpenAI / Perplexity launch sponsored sources, surface auction floors and forecast yield. |
| **Affiliate optimization** | Identifies under-monetized AI/social referrals and recommends widget placements. |

---

## 6. Target customer (ICP)

### 6.1 Primary ICP — Series A → C B2B SaaS
- ARR: $1M – $25M
- Marketing team: 2–8 people, including a dedicated content/SEO function
- Pain: "We rank on Google for X but ChatGPT recommends our competitor"
- Buying authority: VP Marketing or Head of Growth
- Typical contract: $149 – $999 / month
- Volume: ~30,000 companies globally fit this exactly

### 6.2 Secondary ICP — Mid-market DTC + content brands
- Revenue: $1M – $50M
- Single-person AdOps + agency setup
- Pain: "Our affiliate revenue plateaued and we don't know where the next dollar is"
- Typical contract: $299 – $1,999 / month (yield consulting upsell)
- Volume: ~80,000 brands

### 6.3 Tertiary ICP — Publishers + content media
- Monthly visitors: 500k – 10M
- Existing AdOps team, multiple SSP relationships
- Pain: "Yield is flat and we can't quantify the AI-search traffic impact"
- Typical contract: $999 – $4,999 / month + revenue share on partnerships
- Volume: ~12,000 globally

---

## 7. Competitive landscape

### 7.1 Direct competitors (AI visibility)

| Competitor | Strengths | Gaps vs. sparrwo |
|---|---|---|
| **Profound** | Best citation extraction; well-funded | Visibility only; no traffic, no monetization |
| **AthenaHQ** | Clean dashboard; YC pedigree | Same — visibility only |
| **Otterly.ai** | EU-focused; affordable | Visibility only; no PR engine |
| **Peec** | Strong reporting | Visibility only |
| **Goodie / TryRadar / etc.** | Various niche cuts | No closed loop |

**Our edge**: sparrwo is the only product that runs the full visibility → traffic → monetization loop in one workspace. The integration is the moat — each module is more valuable inside the loop than as a point tool.

### 7.2 Adjacent competitors

| Category | Examples | Why we win |
|---|---|---|
| SEO suites | Ahrefs, Semrush, Moz | They don't measure AI engines. They don't tie keyword research to LLM prompts. They don't do monetization. |
| Analytics | GA4, Mixpanel, Amplitude | They don't classify intent against AI prompt categories. They don't enrich sources with AI engine context. |
| AdOps platforms | Magnite, PubMatic, Index, Outbrain | They optimize at the SSP layer; we sit a layer above and direct budget to it. We're a buyer/optimizer, not an SSP. |
| Content briefs | MarketMuse, Clearscope, Frase | Their briefs target Google ranking. Ours target *AI citation*, which is a different (and increasingly more valuable) outcome. |
| PR tools | Muckrack, Cision, Prowly | They list journalists. We tell you *which* journalists to pitch given which AI citation gap you have. |

### 7.3 Why incumbents can't just copy us
- **SEO incumbents** (Ahrefs / Semrush) are anchored on rank-data revenue and 10+ year codebases. Adding AI visibility is a tab; rebuilding their analytics+monetization layer is a rewrite.
- **AdOps platforms** make money on managed media volume, not insights — adding visibility intelligence means competing with their own customers (agencies).
- **Visibility-only startups** (Profound, AthenaHQ) would need to acquire GA4 + AdOps competency to catch us. They've raised on a narrower thesis.
- **Pure analytics** (GA4, Amplitude) won't move because their North Star is event volume, not marketing outcomes.

---

## 8. Pricing & packaging

### 8.1 Tiers

| Plan | Monthly | What's included |
|---|---|---|
| **Free** | $0 | One-shot scan; share-of-voice for own brand; email capture |
| **Starter** | $99 | 5 workspaces; 50 scans/mo; competitor tracking (up to 5); GA4 connector; basic monetization view |
| **Growth** | $299 | 15 workspaces; 250 scans/mo; sentiment + citations; publication targeting; full traffic intelligence; yield headroom report |
| **Pro** | $999 | Unlimited; multi-run stability; lift attribution; partner matching; brief generation; SSP integration; sponsored-AI inventory |
| **Enterprise** | custom | + journalist DB; + dedicated success; + revenue share on managed partnerships |

### 8.2 Expansion revenue
- **Per-scan overage**: $1.50/scan above tier limit
- **Yield consulting**: 15% of incremental yield captured (Growth and above)
- **Managed partnerships**: 20% rev-share on brand partnerships matched and closed through sparrwo

### 8.3 Unit economics target
- **CAC**: $1,200 (mixed inbound + outbound)
- **ACV (blended)**: $4,200
- **Gross margin**: 78% (after LLM costs, DataForSEO, Serper, infra)
- **Payback**: 5 months

---

## 9. Defensibility / moat

### 9.1 Data moat
Every customer scan adds to the citation graph + journalist + publication tier datasets. After ~10k scans we have the most comprehensive map of which sources LLMs trust per vertical in existence. That dataset is what makes "intelligent recommendations" possible. New entrants would need months and thousands of dollars of LLM credits to replicate it.

### 9.2 Integration moat
Connecting GA4 + DataForSEO + Anthropic + OpenAI + Gemini + Perplexity + Serper + Muckrack + SSP wrappers + affiliate networks is real engineering. The roadmap puts the integration layer in Phase 1 and treats it as the durable asset, not the LLM prompts.

### 9.3 Workflow moat
Closed-loop workflow — *gap detected → brief generated → published → lift measured* — creates a sticky activity loop. Once a team runs through the cycle twice, switching to a point tool means rebuilding spreadsheets and losing the attribution.

### 9.4 Network effect (partnerships)
The brand-matching layer in Monetization creates a two-sided network: brands on sparrwo become discoverable to other brands on sparrwo for partnerships. The graph compounds.

---

## 10. Go-to-market

### 10.1 The wedge: free scan
A `scannr.com/scan?domain=...` URL that any marketer can paste and get back a real, useful AI visibility report in 90 seconds with zero auth. Email capture wall sits between the headline score and the full ICP+SoV+Citations breakdown. This is the single best top-of-funnel asset in the SEO/martech category right now — it's the equivalent of Ahrefs' "Free SEO Audit" but for AI search.

### 10.2 PLG to PLM
1. Free scan → email capture
2. Email nurture: "your scan ran 3 weeks ago — appearance rate dropped 12%. See drift report" (gated to Starter)
3. Starter ($99) → connect GA4, see traffic correlation
4. Growth ($299) → publication targeting unlocks PR workflow
5. Pro ($999) → monetization + lift attribution closes the loop

### 10.3 Outbound + thought leadership
- Weekly "State of AI search" report (industry benchmarks from our aggregated scans) → most-cited research in the GEO category within 12 months
- Vertical playbooks ("How [vertical] brands appear in ChatGPT") → ICP discovery
- Founder content on LinkedIn / X explaining specific brand citation case studies

### 10.4 Distribution partners
- Agencies servicing the SEO/PR functions become resellers (white-label dashboard)
- Adjacent SaaS (HubSpot, Ahrefs partner programs, Notion templates) integrations as referral surfaces

---

## 11. Risks & open questions

### 11.1 Top risks

| Risk | Mitigation |
|---|---|
| LLM APIs change pricing or rate limits | Multi-engine architecture; abstract engine layer; can swap engines without rewriting product |
| Profound or AthenaHQ acquires GA4 connector first | We're 6 months ahead on the closed-loop thesis; lock down design partners by Q3 |
| Brand-safe sponsored AI mentions don't materialize | Monetization works even without that channel (yield + partnerships are the bulk) |
| GA4 / DataForSEO data quality | Layer onto known-good sources (Search Console, GA4 v2 API); never paint over data gaps |
| LLM hallucinations in brief generation | Briefs always show source citations; never auto-publish; human-in-loop |

### 11.2 Open questions (called out in [ROADMAP.md §14](./ROADMAP.md))
1. Vertical taxonomy granularity (G2's 1,500 categories or a custom 50?)
2. Locale defaults for the free scan (auto-detect by IP, or default US?)
3. Wikipedia opportunity surfacing — yes/no for the difficulty
4. Self-host vs. Supabase at scale
5. Build vs. buy on the journalist DB

---

## 12. The 12-month picture

By end of year 1:
- ~3,000 free scans/week running on the free tier
- ~500 paying customers across Starter / Growth / Pro
- ~$1.8M ARR with 70%+ gross margin
- Closed loop fully wired in production: scan → recommend → publish → lift measured
- The default reference dataset for "which publications LLMs cite in [vertical]" in the industry
- A defensible second-act story (Monetization + Partnerships) that triples ACV at the top

---

## 13. Glossary

- **AI visibility**: Whether a brand appears in an LLM-generated answer to a buyer-intent query.
- **Citation**: A source URL or domain an LLM grounds on when generating an answer.
- **Share of Voice (SoV)**: Brand mentions / total brand mentions across a defined prompt set.
- **GEO**: Generative Engine Optimization — the discipline of making a brand more cited in AI answers.
- **AI yield premium**: The eCPM lift on AI-referred sessions vs. organic / search sessions.
- **Intent stage**: One of *informational* / *discovery* / *commercial* / *transactional* — the funnel position of a buyer query.
- **Stability**: Fraction of repeated runs in which a brand appears for the same prompt; proxy for reliability.
- **Lift**: Measured change in a metric (appearance, traffic, revenue) between baseline and post-intervention periods.
- **Drift**: Unprompted regression in appearance rate, SoV, sentiment, or traffic.
- **Demand surface**: Sum of search volume across Google + Bing + Reddit + Quora + YouTube views, per query.
- **AdOps**: Ad operations — the practice of managing yield across multiple monetization channels.
- **SSP wrapper**: Server-side configuration that orchestrates auctions across multiple supply-side platforms (Prebid, etc.).
- **eCPM**: Effective cost per 1,000 impressions — primary yield metric for display monetization.
- **AI referral**: A web session whose GA4 source is one of the AI assistants (chatgpt.com, perplexity.ai, etc.).
- **Counterfactual**: A held-out set of metrics used to confirm that an observed lift was caused by the intervention, not background drift.

---

*End of product document. Next companion to write: GTM-PLAYBOOK.md (channel-by-channel acquisition tactics) and PRICING.md (final tier definitions + objection handling).*
