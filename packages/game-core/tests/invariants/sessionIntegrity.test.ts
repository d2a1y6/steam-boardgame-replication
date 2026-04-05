import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGame,
  getBuildableHexIds,
  getTrackPlacementOptions,
  getWorkingState,
  type EngineSession,
} from "@steam/game-core";
import { baseRuleSet, getMapDefinition, steamContentCatalogs } from "@steam/game-content";

function assertSessionInvariants(session: EngineSession) {
  const state = getWorkingState(session);
  const playerIds = new Set(state.players.map((player) => player.id));
  const trackIds = new Set(state.map.trackPieces.map((track) => track.id));
  const segmentIds = new Set(state.map.segments.map((segment) => segment.id));
  const activeOrder =
    state.turn.phase === "build-track" && state.turn.buildOrder.length > 0
      ? state.turn.buildOrder
      : state.turn.turnOrder;

  expect(playerIds.size).toBe(state.players.length);
  expect(activeOrder.length).toBeGreaterThan(0);
  expect(state.turn.currentPlayerIndex).toBeGreaterThanOrEqual(0);
  expect(state.turn.currentPlayerIndex).toBeLessThan(activeOrder.length);

  for (const playerId of state.turn.turnOrder) {
    expect(playerIds.has(playerId)).toBe(true);
  }

  for (const count of Object.values(state.supply.tilePool.counts)) {
    expect(count).toBeGreaterThanOrEqual(0);
  }

  for (const segment of state.map.segments) {
    expect(trackIds.has(segment.trackId)).toBe(true);
  }

  for (const link of state.map.links) {
    for (const segmentId of link.segmentIds) {
      expect(segmentIds.has(segmentId)).toBe(true);
    }
  }
}

describe("session invariants", () => {
  it("在选牌、建轨草稿和建轨提交后仍满足核心不变量", () => {
    const map = getMapDefinition("ne-usa-se-canada");
    if (!map) {
      throw new Error("测试地图不存在。");
    }

    let session = createGame({
      playerNames: ["Alice", "Bob", "Carol"],
      botPlayerIds: ["player-2", "player-3"],
      map,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
      mapId: map.id,
      mode: "base",
    });

    assertSessionInvariants(session);

    session = applyAction(session, { type: "select-action-tile", playerId: "player-1", tileId: "turn-order" });
    session = applyAction(session, { type: "select-action-tile", playerId: "player-2", tileId: "engineer" });
    session = applyAction(session, { type: "select-action-tile", playerId: "player-3", tileId: "first-build" });
    assertSessionInvariants(session);

    const activeBuilderId = getWorkingState(session).turn.buildOrder[getWorkingState(session).turn.currentPlayerIndex] ?? "player-1";
    const buildTileId = ["21", "22", "23", "T21", "T22", "T23", "T11"].find(
      (tileId) => getBuildableHexIds(session, activeBuilderId, tileId).length > 0,
    );
    const buildableHexId = buildTileId ? getBuildableHexIds(session, activeBuilderId, buildTileId)[0] : null;
    if (!buildableHexId) {
      throw new Error("未找到合法建轨位置。");
    }
    const placement = getTrackPlacementOptions(session, activeBuilderId, buildTileId!, buildableHexId)[0];
    if (!placement) {
      throw new Error("未找到合法朝向。");
    }

    session = applyAction(session, {
      type: "place-track",
      playerId: activeBuilderId,
      hexId: buildableHexId,
      tileId: buildTileId!,
      rotation: placement.rotation,
    });
    assertSessionInvariants(session);

    session = applyAction(session, {
      type: "finish-build",
      playerId: activeBuilderId,
    });
    assertSessionInvariants(session);
  });
});
