import { describe, expect, it } from "vitest";
import {
  createGame,
  createReplayFrame,
  deserializeSession,
  serializeSession,
  type SaveSnapshotV1,
} from "@steam/game-core";
import { baseRuleSet, getMapDefinition, steamContentCatalogs } from "@steam/game-content";

describe("serialization migrations", () => {
  it("会把 v1 快照迁移到当前 schema version", () => {
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

    const currentSnapshot = serializeSession(session, [createReplayFrame(session, "初始快照")]);
    const legacySnapshot: SaveSnapshotV1 = {
      ...currentSnapshot,
      schemaVersion: 1,
    };

    const migrated = deserializeSession(legacySnapshot);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.session.config.mapId).toBe("ne-usa-se-canada");
    expect(migrated.replayFrames).toHaveLength(1);
  });
});
