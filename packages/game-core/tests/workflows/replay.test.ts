import { describe, expect, it } from "vitest";
import { appendReplayFrame, applyAction, createGame, createReplayFrame, restoreReplayFrame } from "@steam/game-core";
import { baseRuleSet, getMapDefinition, steamContentCatalogs } from "@steam/game-content";

describe("replay", () => {
  it("会记录回放帧并允许恢复会话快照", () => {
    const map = getMapDefinition("ne-usa-se-canada");
    if (!map) {
      throw new Error("测试地图不存在。");
    }
    const session = createGame({
      playerNames: ["Alice", "Bob", "Carol"],
      botPlayerIds: ["player-2", "player-3"],
      map,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
      mapId: map.id,
      mode: "base",
    });

    const progressedSession = applyAction(session, {
      type: "select-action-tile",
      playerId: "player-1",
      tileId: "turn-order",
    });

    const frames = appendReplayFrame([], progressedSession, "已选择行动牌");
    expect(frames).toHaveLength(1);
    expect(frames[0]?.label).toBe("已选择行动牌");

    const restored = restoreReplayFrame(frames[0]!);
    expect(restored.committed.turn.phase).toBe("select-action");
    expect(restored.committed.players[0]?.name).toBe("Alice");
    expect(restored.actionHistory).toHaveLength(1);
    expect(restored.config.mapId).toBe("ne-usa-se-canada");

    const directFrame = createReplayFrame(progressedSession, "直接快照");
    expect(directFrame.activePlayerName).toBe("Bob");
  });
});
