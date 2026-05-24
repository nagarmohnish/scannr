import { describe, expect, it } from "vitest";
import { cleanCompanyName, stripCodeFences } from "@/lib/scanner/parse";

describe("stripCodeFences", () => {
  it("removes ```json fences", () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("removes generic ``` fences", () => {
    expect(stripCodeFences("```\n{}\n```")).toBe("{}");
  });

  it("leaves unfenced text alone", () => {
    expect(stripCodeFences('{"a":1}')).toBe('{"a":1}');
  });

  it("trims trailing whitespace after fence", () => {
    expect(stripCodeFences("```json\n{}\n```   ")).toBe("{}");
  });
});

describe("cleanCompanyName", () => {
  it("strips ' by Person Name' suffix", () => {
    expect(cleanCompanyName("SuperYou by Ranveer Singh")).toBe("SuperYou");
  });

  it("strips '- tagline' suffix", () => {
    expect(cleanCompanyName("Acme Compost - Compostable packaging")).toBe("Acme Compost");
  });

  it("strips '– tagline' (en dash) suffix", () => {
    expect(cleanCompanyName("Acme – Eco packaging")).toBe("Acme");
  });

  it("leaves clean names alone", () => {
    expect(cleanCompanyName("CleverTap")).toBe("CleverTap");
  });
});
