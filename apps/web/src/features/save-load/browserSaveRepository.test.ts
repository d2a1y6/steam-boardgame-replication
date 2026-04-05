import { beforeEach, describe, expect, it } from "vitest";
import { applyAction, createGame, createReplayFrame } from "@steam/game-core";
import { baseRuleSet, getMapDefinition, steamContentCatalogs } from "@steam/game-content";
import { clearSavedGamesStorage, deleteSavedGame, listSavedGames, loadSavedGame, saveGame } from "./browserSaveRepository";

describe("persistence", () => {
  beforeEach(() => {
    clearSavedGamesStorage();
  });

  it("可以保存、列出、载入并删除本地存档", () => {
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
    const replayFrames = [createReplayFrame(progressedSession, "已选择行动牌")];

    const saved = saveGame(progressedSession, replayFrames, "测试存档");
    expect(listSavedGames()).toHaveLength(1);
    expect(listSavedGames()[0]?.label).toBe("测试存档");

    const loaded = loadSavedGame(saved.id);
    expect(loaded?.session.committed.players[0]?.name).toBe("Alice");
    expect(loaded?.session.config.mode).toBe("base");
    expect(loaded?.session.actionHistory).toHaveLength(1);
    expect(loaded?.replayFrames).toHaveLength(1);

    expect(deleteSavedGame(saved.id)).toHaveLength(0);
    expect(loadSavedGame(saved.id)).toBeNull();
  });
});
