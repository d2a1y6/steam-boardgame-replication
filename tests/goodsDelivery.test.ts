import { describe, expect, it } from "vitest";
import { getDeliveryCandidates } from "../src/rules/goodsDelivery";
import { createInitialState } from "../src/state/initialState";
import { neUsaSeCanadaMap } from "../src/data/maps/ne_usa_se_canada";

describe("goodsDelivery", () => {
  it("returns no candidate when no complete links exist", () => {
    const game = createInitialState({ playerNames: ["Ada", "Babbage", "Curie"], map: neUsaSeCanadaMap });
    expect(getDeliveryCandidates(game, game.players[0].id)).toHaveLength(0);
  });
});
