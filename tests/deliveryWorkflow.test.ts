import { describe, expect, it } from "vitest";
import { applyAction } from "../src/engine/applyAction";
import { getMovableGoodsSources, getRankedDeliveryCandidatesForSource } from "../src/engine/legalMoves";
import { getDeliveryPreview } from "../src/engine/previews";
import { createGame } from "../src/engine/createGame";
import { neUsaSeCanadaMap } from "../src/data/maps/ne_usa_se_canada";

describe("deliveryWorkflow", () => {
  it("会把货物源、候选方案和执行结果串起来", () => {
    const session = createGame({
      playerNames: ["Ada", "Babbage", "Curie"],
      botPlayerIds: ["player-2", "player-3"],
      map: {
        ...neUsaSeCanadaMap,
        hexes: [
          ...neUsaSeCanadaMap.hexes,
          { id: "red-harbor", q: 4, r: 0, terrain: "city", cityColor: "red", cityDemand: 1, label: "Red Harbor" },
        ],
      },
      mode: "base",
    });

    session.committed.turn.phase = "move-goods-round-1";
    session.committed.map.cityGoods["new-york"] = ["red"];
    session.committed.map.links = [
      {
        id: "link-1",
        segmentIds: [],
        ownerId: "player-1",
        touchedStops: ["new-york", "albany"],
        complete: true,
      },
    ];

    const sources = getMovableGoodsSources(session, "player-1");
    expect(sources).toHaveLength(1);
    expect(sources[0]?.sourceHexId).toBe("new-york");

    const candidates = getRankedDeliveryCandidatesForSource(session, "player-1", "new-york", "red");
    expect(candidates).toHaveLength(1);

    const preview = getDeliveryPreview(session, candidates[0]!);
    expect(preview.payoutText).toContain("Ada +1");

    const resolved = applyAction(session, {
      type: "deliver-goods",
      playerId: "player-1",
      candidateId: candidates[0]!.id,
    });

    expect(resolved.committed.players[0]?.victoryPoints).toBe(1);
    expect(resolved.committed.map.cityGoods["new-york"]).toHaveLength(0);
  });
});
