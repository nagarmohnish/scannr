import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/scanner/rate-limit";

describe("createRateLimiter", () => {
  it("allows requests up to max", () => {
    const rl = createRateLimiter({ max: 3, windowMs: 1000 });
    expect(rl.check("ip1")).toBe(true);
    expect(rl.check("ip1")).toBe(true);
    expect(rl.check("ip1")).toBe(true);
  });

  it("blocks the 4th request when max is 3", () => {
    const rl = createRateLimiter({ max: 3, windowMs: 1000 });
    rl.check("ip1");
    rl.check("ip1");
    rl.check("ip1");
    expect(rl.check("ip1")).toBe(false);
  });

  it("tracks different keys independently", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 1000 });
    expect(rl.check("ip1")).toBe(true);
    expect(rl.check("ip1")).toBe(false);
    expect(rl.check("ip2")).toBe(true);
    expect(rl.check("ip2")).toBe(false);
  });

  it("resets after the window expires", () => {
    let now = 1000;
    const rl = createRateLimiter({ max: 2, windowMs: 100, now: () => now });
    rl.check("ip1");
    rl.check("ip1");
    expect(rl.check("ip1")).toBe(false);
    now += 200;
    expect(rl.check("ip1")).toBe(true);
  });

  it("reset() clears state", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 1000 });
    rl.check("ip1");
    expect(rl.check("ip1")).toBe(false);
    rl.reset();
    expect(rl.check("ip1")).toBe(true);
  });
});
