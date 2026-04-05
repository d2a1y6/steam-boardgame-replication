import { describe, expect, it } from "vitest";
import { createReplayFrame } from "../replay/replay";
import { createGame } from "../actions/createGame";
import { deserializeSession } from "./deserializeSession";
import { serializeSession } from "./serializeSession";
import type { SaveSnapshotV0 } from "../contracts/save";
import { baseRuleSet, neUsaSeCanadaMap, steamContentCatalogs } from "@steam/game-content";

function createSession() {
  return createGame({
    playerNames: ["Alice", "Bob", "Carol"],
    botPlayerIds: ["player-2", "player-3"],
    map: neUsaSeCanadaMap,
    ruleset: baseRuleSet,
    content: steamContentCatalogs,
  });
}

describe("deserializeSession", () => {
  it("会把缺少 schemaVersion 的旧快照迁移到当前版本", () => {
    const session = createSession();
    const legacySnapshot: SaveSnapshotV0 = {
      session,
      replayFrames: [createReplayFrame(session, "legacy")],
    };

    const restored = deserializeSession(legacySnapshot);
    expect(restored.schemaVersion).toBe(2);
    expect(restored.session.committed.players[0]?.name).toBe("Alice");
    expect(restored.replayFrames).toHaveLength(1);
  });

  it("会保持当前版本快照的结构不变", () => {
    const session = createSession();
    const snapshot = serializeSession(session, [createReplayFrame(session, "current")]);
    const restored = deserializeSession(snapshot);
    expect(restored).toEqual(snapshot);
  });
});
