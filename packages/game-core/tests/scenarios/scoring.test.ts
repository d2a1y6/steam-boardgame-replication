import { describe, expect, it } from "vitest";
import { baseRuleSet, neUsaSeCanadaMap, steamContentCatalogs } from "@steam/game-content";
import { calculateFinalScores } from "../../src/rules/scoring";
import { createInitialState } from "../../src/state/initialState";

describe("scoring", () => {
  it("converts positive income to endgame points", () => {
    const game = createInitialState({
      playerNames: ["Ada", "Babbage", "Curie"],
      map: neUsaSeCanadaMap,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
    });
    game.players[0].income = 5;
    const scores = calculateFinalScores(game);
    expect(scores.find((item) => item.playerId === game.players[0].id)?.total).toBe(2);
  });
});
