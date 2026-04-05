import { describe, expect, it } from "vitest";
import { applyAction, createGame, getBuildableHexIds, getTrackPaletteOptions, getTrackPlacementOptions, resetDraft } from "@steam/game-core";
import { baseRuleSet, getMapDefinition, steamContentCatalogs } from "@steam/game-content";

function enterBuildPhase() {
  const map = getMapDefinition("ne-usa-se-canada");
  if (!map) {
    throw new Error("测试地图不存在。");
  }
  let session = createGame({
    playerNames: ["Ada", "Babbage", "Curie"],
    botPlayerIds: ["player-2", "player-3"],
    map,
    ruleset: baseRuleSet,
    content: steamContentCatalogs,
    mapId: map.id,
    mode: "base",
  });

  session = applyAction(session, { type: "select-action-tile", playerId: "player-1", tileId: "turn-order" });
  session = applyAction(session, { type: "select-action-tile", playerId: "player-2", tileId: "first-move" });
  session = applyAction(session, { type: "select-action-tile", playerId: "player-3", tileId: "engineer" });
  return session;
}

describe("buildDraftFlow", () => {
  it("把建轨写进草稿并允许重置，再在结束建轨时提交", () => {
    let session = enterBuildPhase();
    expect(session.committed.turn.phase).toBe("build-track");

    const tileOption = getTrackPaletteOptions(session).find((tile) =>
      getBuildableHexIds(session, "player-1", tile.tileId).length > 0,
    );
    expect(tileOption).toBeDefined();

    const hexId = getBuildableHexIds(session, "player-1", tileOption!.tileId)[0]!;
    const placement = getTrackPlacementOptions(session, "player-1", tileOption!.tileId, hexId)[0]!;

    session = applyAction(session, {
      type: "place-track",
      playerId: "player-1",
      hexId,
      tileId: tileOption!.tileId,
      rotation: placement.rotation,
    });

    expect(session.committed.map.trackPieces).toHaveLength(0);
    expect(session.draft?.working.map.trackPieces).toHaveLength(1);

    const resetSession = resetDraft(session);
    expect(resetSession.draft?.working.map.trackPieces).toHaveLength(0);

    session = applyAction(resetSession, {
      type: "place-track",
      playerId: "player-1",
      hexId,
      tileId: tileOption!.tileId,
      rotation: placement.rotation,
    });
    session = applyAction(session, { type: "finish-build", playerId: "player-1" });

    expect(session.draft).toBeNull();
    expect(session.committed.map.trackPieces).toHaveLength(1);
    expect(session.committed.turn.phase).toBe("build-track");
    expect(session.committed.turn.currentPlayerIndex).toBe(1);
  });
});
