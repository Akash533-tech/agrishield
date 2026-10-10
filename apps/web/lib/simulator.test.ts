import { describe, expect, it } from "vitest";
import { calculateScenario } from "./simulator";

describe("climate scenario calculator", () => {
  it("is deterministic and caps triggered policies at the covered population", () => {
    const input = { rainfall: 28, temperature: 39, severity: 82, farmers: 1000, liquidityMillions: 2.4 };
    expect(calculateScenario(input)).toEqual(calculateScenario(input));
    expect(calculateScenario(input).triggered).toBeLessThanOrEqual(1000);
  });
  it("never reports negative remaining capital", () => {
    expect(calculateScenario({ rainfall: 0, temperature: 50, severity: 100, farmers: 5000, liquidityMillions: 1 }).remain).toBe(0);
  });
});
