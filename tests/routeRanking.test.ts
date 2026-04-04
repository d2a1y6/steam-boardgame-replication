import { describe, expect, it } from "vitest";
import { rankDeliveryCandidates } from "../src/rules/routeRanking";

describe("routeRanking", () => {
  it("prefers higher self points", () => {
    const ranked = rankDeliveryCandidates([
      {
        id: "b",
        playerId: "p1",
        sourceHexId: "a",
        destinationHexId: "b",
        goodsColor: "red",
        pathStopIds: ["a", "b"],
        linkIds: ["l1", "l2"],
        pointsByOwner: { p1: 2 },
        selfPoints: 2,
      },
      {
        id: "a",
        playerId: "p1",
        sourceHexId: "a",
        destinationHexId: "c",
        goodsColor: "red",
        pathStopIds: ["a", "c"],
        linkIds: ["l1"],
        pointsByOwner: { p1: 1 },
        selfPoints: 1,
      },
    ]);
    expect(ranked[0].id).toBe("b");
  });
});
