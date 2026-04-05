import { describe, expect, it } from "vitest";
import { createGame } from "@steam/game-core";
import { getMapDefinition, getRuleSet, steamContentCatalogs } from "@steam/game-content";

describe("standardMode", () => {
  it("可以创建标准版入口对局并保留配置", () => {
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

    expect(session.config.mode).toBe("standard");
    expect(session.committed.ruleset.mode).toBe("standard");
  });
});
