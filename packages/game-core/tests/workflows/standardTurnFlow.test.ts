import { describe, expect, it } from "vitest";
import { applyAction, createGame } from "@steam/game-core";
import { getMapDefinition, getRuleSet, steamContentCatalogs } from "@steam/game-content";

describe("standardTurnFlow", () => {
  it("会完成买资本、顺位竞拍和行动牌选择前置流程", () => {
    const map = getMapDefinition("ne-usa-se-canada");
    const ruleset = getRuleSet("standard");
    if (!map || !ruleset) {
      throw new Error("标准版测试内容不存在。");
    }

    const session = createGame({
      playerNames: ["Alice", "Bob", "Carol"],
      botPlayerIds: ["player-2", "player-3"],
      map,
      ruleset,
      content: steamContentCatalogs,
      mapId: map.id,
      mode: "standard",
    });

    const afterCapital1 = applyAction(session, { type: "buy-capital", playerId: "player-1", steps: 2 });
    const afterCapital2 = applyAction(afterCapital1, { type: "buy-capital", playerId: "player-2", steps: 1 });
    const afterCapital3 = applyAction(afterCapital2, { type: "buy-capital", playerId: "player-3", steps: 0 });

    expect(afterCapital3.committed.turn.phase).toBe("auction-turn-order");
    expect(afterCapital3.committed.players[0]?.cash).toBe(10);
    expect(afterCapital3.committed.players[1]?.cash).toBe(5);

    const afterBid1 = applyAction(afterCapital3, { type: "place-auction-bid", playerId: "player-1", bid: 3 });
    const afterBid2 = applyAction(afterBid1, { type: "place-auction-bid", playerId: "player-2", bid: 4 });
    const afterPass = applyAction(afterBid2, { type: "pass-auction", playerId: "player-3" });
    const afterPass2 = applyAction(afterPass, { type: "pass-auction", playerId: "player-1" });

    expect(afterPass2.committed.turn.phase).toBe("select-action");
    expect(afterPass2.committed.turn.turnOrder[0]).toBe("player-2");
    expect(afterPass2.committed.players[1]?.cash).toBe(1);
  });
});
