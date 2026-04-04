import { describe, expect, it } from "vitest";
import { canPlaceTrack } from "../src/rules/trackPlacement";
import { createInitialState } from "../src/state/initialState";
import { neUsaSeCanadaMap } from "../src/data/maps/ne_usa_se_canada";

describe("trackPlacement", () => {
  it("rejects placing non-town track on a town hex", () => {
    const game = createInitialState({ playerNames: ["Ada", "Babbage", "Curie"], map: neUsaSeCanadaMap });
    const result = canPlaceTrack({
      map: game.map,
      player: game.players[0],
      tilePool: game.supply.tilePool,
      hexId: "poughkeepsie",
      tileId: "21",
      rotation: 0,
    });
    expect(result.ok).toBe(false);
  });
});
