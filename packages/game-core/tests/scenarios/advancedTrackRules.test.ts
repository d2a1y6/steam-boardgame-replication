import { describe, expect, it } from "vitest";
import { applyAction, createGame } from "@steam/game-core";
import { baseRuleSet, getMapDefinition, steamContentCatalogs } from "@steam/game-content";
import { rebuildTrackOwnership } from "../../src/rules/trackOwnership";
import { canPlaceTrack } from "../../src/rules/trackPlacement";
import type { MapDefinition } from "../../src/contracts/domain";

function createBuildState() {
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

  session.committed.turn.phase = "build-track";
  session.committed.turn.buildOrder = ["player-1", "player-2", "player-3"];
  session.committed.turn.currentPlayerIndex = 0;
  session.committed.turn.buildAllowanceRemaining = 3;
  session.committed.players[0]!.cash = 20;
  return session;
}

describe("advancedTrackRules", () => {
  it("允许重定向属于自己的 incomplete link 的最后一块轨道", () => {
    const redirectMap: MapDefinition = {
      id: "redirect-map",
      name: "Redirect Map",
      hexes: [
        { id: "origin", q: 0, r: 0, terrain: "city", cityColor: "red", cityDemand: 1, label: "Origin" },
        { id: "mid", q: 1, r: 0, terrain: "plains", label: "Mid" },
        { id: "east", q: 2, r: 0, terrain: "plains", label: "East" },
        { id: "northwest", q: 1, r: -1, terrain: "plains", label: "Northwest" },
      ],
    };
    const session = createGame({
      playerNames: ["Alice", "Bob", "Carol"],
      botPlayerIds: ["player-2", "player-3"],
      map: redirectMap,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
      mapId: redirectMap.id,
      mode: "base",
    });
    session.committed.turn.phase = "build-track";
    session.committed.turn.buildOrder = ["player-1", "player-2", "player-3"];
    session.committed.turn.currentPlayerIndex = 0;
    session.committed.turn.buildAllowanceRemaining = 3;
    session.committed.players[0]!.cash = 20;
    session.committed.map.trackPieces = [
      {
        id: "track-1",
        hexId: "mid",
        tileId: "21",
        ownerId: "player-1",
        rotation: 0,
      },
    ];
    session.committed.map = rebuildTrackOwnership(session.committed.map, session.committed.content.tileManifest);
    const check = canPlaceTrack({
      map: session.committed.map,
      tileManifest: session.committed.content.tileManifest,
      player: session.committed.players[0]!,
      tilePool: session.committed.supply.tilePool,
      hexId: "mid",
      tileId: "22",
      rotation: 2,
    });

    expect(check.ok).toBe(true);
    expect(check.operation).toBe("redirect");

    const nextSession = applyAction(session, {
      type: "place-track",
      playerId: "player-1",
      hexId: "mid",
      tileId: "22",
      rotation: 2,
    });

    expect(nextSession.draft?.working.map.trackPieces).toHaveLength(1);
    expect(nextSession.draft?.working.map.trackPieces[0]?.tileId).toBe("22");
  });

  it("允许用复杂 crossing / passing tile 升级既有轨道，并保留原线路", () => {
    const session = createBuildState();
    session.committed.map.trackPieces = [
      {
        id: "track-1",
        hexId: "hartford",
        tileId: "21",
        ownerId: "player-1",
        rotation: 2,
      },
    ];
    session.committed.map = rebuildTrackOwnership(session.committed.map, session.committed.content.tileManifest);

    const check = canPlaceTrack({
      map: session.committed.map,
      tileManifest: session.committed.content.tileManifest,
      player: session.committed.players[0]!,
      tilePool: session.committed.supply.tilePool,
      hexId: "hartford",
      tileId: "42",
      rotation: 2,
    });

    expect(check.ok).toBe(true);
    expect(check.operation).toBe("improve");
    expect(check.cost).toBe(4);

    const nextSession = applyAction(session, {
      type: "place-track",
      playerId: "player-1",
      hexId: "hartford",
      tileId: "42",
      rotation: 2,
    });

    expect(nextSession.draft?.working.map.trackPieces).toHaveLength(1);
    expect(nextSession.draft?.working.map.trackPieces[0]?.tileId).toBe("42");
    expect(nextSession.draft?.working.map.segments).toHaveLength(2);
  });
});
