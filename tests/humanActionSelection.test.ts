import { describe, expect, it } from "vitest";
import { applyAction } from "../src/engine/applyAction";
import { createGame } from "../src/engine/createGame";
import { getSelectableActionTiles } from "../src/engine/legalMoves";

describe("humanActionSelection", () => {
  it("在选牌阶段会把已被占用的行动牌标记为 disabled", () => {
    const session = createGame({
      playerNames: ["Ada", "Babbage", "Curie"],
      botPlayerIds: ["player-2", "player-3"],
      mapId: "ne-usa-se-canada",
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
