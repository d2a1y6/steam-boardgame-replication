import { describe, expect, it } from "vitest";
import { baseRuleSet, neUsaSeCanadaMap, steamContentCatalogs } from "@steam/game-content";
import { canPlaceTrack } from "../../src/rules/trackPlacement";
import { createInitialState } from "../../src/state/initialState";

describe("trackPlacement", () => {
  it("rejects placing non-town track on a town hex", () => {
    const game = createInitialState({
      playerNames: ["Ada", "Babbage", "Curie"],
      map: neUsaSeCanadaMap,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
    });
    const result = canPlaceTrack({
      map: game.map,
      tileManifest: game.content.tileManifest,
      player: game.players[0],
      tilePool: game.supply.tilePool,
      hexId: "poughkeepsie",
      tileId: "21",
      rotation: 0,
    });
    expect(result.ok).toBe(false);
  });
});
