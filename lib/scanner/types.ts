export type Category = "informational" | "discovery" | "commercial" | "transactional";

export const CATEGORIES: Category[] = [
  "informational",
  "discovery",
  "commercial",
  "transactional",
];

export interface BusinessProfile {
  companyName: string;
  whatTheySell: string;
  industry: string;
  geography: string;
  businessModel: string;
}

export interface Icp {
  primaryBuyer: string;
  buyerLocation: string;
  buyerCompanySize: string;
  buyerPainPoint: string;
  buyerContext: string;
}

export interface GeneratePromptsResult {
  businessProfile: BusinessProfile;
  icp: Icp;
  prompts: Record<Category, string[]>;
  brandVariations: string[];
}

export interface FlatPrompt {
  text: string;
  category: Category;
}

export interface EngineResult {
  appeared: boolean;
  snippet: string;
}

export type EngineName = "gemini" | "claude" | "chatgpt" | "perplexity";

export interface PromptResult {
  prompt: string;
  category: Category;
  gemini: EngineResult;
  claude: EngineResult;
  chatgpt: EngineResult;
  perplexity: EngineResult;
}

export interface ScanResults {
  overallScore: number;
  engines: Record<EngineName, { score: number; available: boolean }>;
  categoryScores: Record<Category, { appeared: number; total: number }>;
  results: PromptResult[];
}

export interface WebsiteData {
  url: string;
  title: string;
  metaDescription: string;
  h1s: string[];
  bodyText: string;
  brandVariations: string[];
}
