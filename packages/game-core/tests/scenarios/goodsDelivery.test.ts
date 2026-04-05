import { describe, expect, it } from "vitest";
import { baseRuleSet, neUsaSeCanadaMap, steamContentCatalogs } from "@steam/game-content";
import { getDeliveryCandidates } from "../../src/rules/goodsDelivery";
import { createInitialState } from "../../src/state/initialState";

describe("goodsDelivery", () => {
  it("returns no candidate when no complete links exist", () => {
    const game = createInitialState({
      playerNames: ["Ada", "Babbage", "Curie"],
      map: neUsaSeCanadaMap,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
    });
    expect(getDeliveryCandidates(game, game.players[0].id)).toHaveLength(0);
  });
});
