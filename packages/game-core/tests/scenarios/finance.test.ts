import { describe, expect, it } from "vitest";
import { ensureCashForImmediateCost } from "../../src/rules/finance";

describe("finance", () => {
  it("raises the minimum 5-dollar multiple and leaves change in cash", () => {
    const result = ensureCashForImmediateCost(
      {
        id: "p1",
        name: "Ada",
        color: "orange",
        cash: 1,
        income: 0,
        victoryPoints: 0,
        locomotiveLevel: 1,
        bankrupt: false,
        isBot: false,
      },
      4,
    );

    expect(result.player.income).toBe(-1);
    expect(result.player.cash).toBe(2);
    expect(result.change).toBe(2);
  });
});
