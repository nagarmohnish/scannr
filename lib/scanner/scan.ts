import { detectBrand, extractSnippet } from "./brand";
import type { EngineAdapters } from "./engines";
import type {
  Category,
  EngineName,
  EngineResult,
  FlatPrompt,
  PromptResult,
  ScanResults,
} from "./types";
import { CATEGORIES } from "./types";

const ENGINES: EngineName[] = ["gemini", "claude", "chatgpt", "perplexity"];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function flattenPrompts(
  byCategory: Record<Category, string[]>
): FlatPrompt[] {
  const flat: FlatPrompt[] = [];
  for (const cat of CATEGORIES) {
    const list = byCategory[cat];
    if (Array.isArray(list)) {
      for (const text of list) flat.push({ text, category: cat });
    }
  }
  return flat;
}

async function runEngineOnPrompts(
  engineName: EngineName,
  adapter: ((p: string) => Promise<string>) | undefined,
  prompts: FlatPrompt[],
  brandVariations: string[],
  staggerMs: number
): Promise<EngineResult[]> {
  if (!adapter) {
    return prompts.map(() => ({ appeared: false, snippet: "" }));
  }
  const settled = await Promise.allSettled(
    prompts.map((fp, i) =>
      sleep(i * staggerMs).then(async () => {
        const responseText = await adapter(fp.text);
        return {
          appeared: detectBrand(responseText, brandVariations),
          snippet: extractSnippet(responseText, brandVariations),
        };
      })
    )
  );
  return settled.map((r) => {
    if (r.status === "fulfilled") return r.value;
    return { appeared: false, snippet: "" };
  });
}

export interface RunScanOptions {
  flatPrompts: FlatPrompt[];
  brandVariations: string[];
  adapters: EngineAdapters;
  staggerMs?: Partial<Record<EngineName, number>>;
}

export async function runScan(opts: RunScanOptions): Promise<ScanResults> {
  const { flatPrompts, brandVariations, adapters } = opts;
  const stagger: Record<EngineName, number> = {
    gemini: opts.staggerMs?.gemini ?? 50,
    claude: opts.staggerMs?.claude ?? 300,
    chatgpt: opts.staggerMs?.chatgpt ?? 50,
    perplexity: opts.staggerMs?.perplexity ?? 50,
  };

  const [geminiResults, claudeResults, chatgptResults, perplexityResults] =
    await Promise.all([
      runEngineOnPrompts("gemini", adapters.gemini, flatPrompts, brandVariations, stagger.gemini),
      runEngineOnPrompts("claude", adapters.claude, flatPrompts, brandVariations, stagger.claude),
      runEngineOnPrompts("chatgpt", adapters.chatgpt, flatPrompts, brandVariations, stagger.chatgpt),
      runEngineOnPrompts("perplexity", adapters.perplexity, flatPrompts, brandVariations, stagger.perplexity),
    ]);

  const results: PromptResult[] = flatPrompts.map((fp, i) => ({
    prompt: fp.text,
    category: fp.category,
    gemini: geminiResults[i],
    claude: claudeResults[i],
    chatgpt: chatgptResults[i],
    perplexity: perplexityResults[i],
  }));

  return scoreResults(results, adapters);
}

export function scoreResults(
  results: PromptResult[],
  adapters: EngineAdapters
): ScanResults {
  const available: Record<EngineName, boolean> = {
    gemini: !!adapters.gemini,
    claude: !!adapters.claude,
    chatgpt: !!adapters.chatgpt,
    perplexity: !!adapters.perplexity,
  };

  const engineAppearances: Record<EngineName, number> = {
    gemini: 0,
    claude: 0,
    chatgpt: 0,
    perplexity: 0,
  };
  for (const r of results) {
    for (const e of ENGINES) {
      if (r[e].appeared) engineAppearances[e]++;
    }
  }

  const availableEngineCount = ENGINES.filter((e) => available[e]).length;

  const categoryScores: Record<Category, { appeared: number; total: number }> = {
    informational: { appeared: 0, total: 0 },
    discovery: { appeared: 0, total: 0 },
    commercial: { appeared: 0, total: 0 },
    transactional: { appeared: 0, total: 0 },
  };

  for (const r of results) {
    categoryScores[r.category].total += Math.max(availableEngineCount, 1);
    let appearances = 0;
    for (const e of ENGINES) {
      if (available[e] && r[e].appeared) appearances++;
    }
    categoryScores[r.category].appeared += appearances;
  }

  const total = results.length;
  const totalAppearances = ENGINES.reduce((sum, e) => sum + engineAppearances[e], 0);
  const maxPossible = total * Math.max(availableEngineCount, 1);
  const overallScore =
    maxPossible > 0 ? Math.round((totalAppearances / maxPossible) * 100) : 0;

  const engineScore = (count: number) =>
    total > 0 ? Math.round((count / total) * 100) : 0;

  const engines: Record<EngineName, { score: number; available: boolean }> = {
    gemini: { score: engineScore(engineAppearances.gemini), available: available.gemini },
    claude: { score: engineScore(engineAppearances.claude), available: available.claude },
    chatgpt: { score: engineScore(engineAppearances.chatgpt), available: available.chatgpt },
    perplexity: { score: engineScore(engineAppearances.perplexity), available: available.perplexity },
  };

  return { overallScore, engines, categoryScores, results };
}
