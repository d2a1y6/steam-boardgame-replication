import { describe, expect, it } from "vitest";
import { applyAction, createGame, getSelectableActionTiles } from "@steam/game-core";
import { baseRuleSet, getMapDefinition, steamContentCatalogs } from "@steam/game-content";

describe("humanActionSelection", () => {
  it("在选牌阶段会把已被占用的行动牌标记为 disabled", () => {
    const map = getMapDefinition("ne-usa-se-canada");
    if (!map) {
      throw new Error("测试地图不存在。");
    }
    const session = createGame({
      playerNames: ["Ada", "Babbage", "Curie"],
      botPlayerIds: ["player-2", "player-3"],
      map,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
      mapId: map.id,
      mode: "base",
    });

    const before = getSelectableActionTiles(session);
    expect(before.every((tile) => tile.disabled === false)).toBe(true);

    const nextSession = applyAction(session, {
      type: "select-action-tile",
      playerId: "player-1",
      tileId: "turn-order",
    });

    const after = getSelectableActionTiles(nextSession);
    expect(after.find((tile) => tile.tileId === "turn-order")?.disabled).toBe(true);
    expect(nextSession.committed.turn.selectedActionTiles["player-1"]).toBe("turn-order");
  });
});
