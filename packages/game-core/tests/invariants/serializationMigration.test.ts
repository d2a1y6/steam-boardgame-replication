import { describe, expect, it } from "vitest";
import {
  createGame,
  createReplayFrame,
  deserializeSession,
  serializeSession,
  type PersistedSaveSnapshot,
} from "@steam/game-core";
import { baseRuleSet, neUsaSeCanadaMap, steamContentCatalogs } from "@steam/game-content";

describe("serialization migration invariants", () => {
  it("可以把没有 schemaVersion 的旧快照迁移为当前版本", () => {
    const session = createGame({
      playerNames: ["Alice", "Bob", "Carol"],
      botPlayerIds: ["player-2", "player-3"],
      map: neUsaSeCanadaMap,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
      mapId: neUsaSeCanadaMap.id,
      mode: "base",
    });
    const frame = createReplayFrame(session, "初始快照");

    const legacySnapshot: PersistedSaveSnapshot = {
      session,
      replayFrames: [frame],
    };

    const migrated = deserializeSession(legacySnapshot);
    const current = serializeSession(session, [frame]);

    expect(migrated.schemaVersion).toBe(current.schemaVersion);
    expect(migrated.session.config.mapId).toBe(neUsaSeCanadaMap.id);
    expect(migrated.replayFrames[0]?.label).toBe("初始快照");
  });
});
