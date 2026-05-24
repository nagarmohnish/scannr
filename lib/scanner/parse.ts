export function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

export function cleanCompanyName(name: string): string {
  return name
    .replace(/\s+by\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*/g, "")
    .replace(/\s*[-–]\s*.+$/, "")
    .trim();
}
