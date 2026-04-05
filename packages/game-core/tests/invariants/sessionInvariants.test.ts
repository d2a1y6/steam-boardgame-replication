import { describe, expect, it } from "vitest";
import { RandomBot, applyAction, createGame, runBotStep, selectCurrentPlayer, type EngineSession } from "@steam/game-core";
import { baseRuleSet, neUsaSeCanadaMap, steamContentCatalogs } from "@steam/game-content";

function expectSessionInvariants(session: EngineSession) {
  const state = session.draft?.working ?? session.committed;
  const activeOrder =
    state.turn.phase === "build-track" && state.turn.buildOrder.length > 0
      ? state.turn.buildOrder
      : state.turn.turnOrder;

  expect(state.players.length).toBeGreaterThan(0);
  expect(state.turn.currentPlayerIndex).toBeGreaterThanOrEqual(0);
  expect(state.turn.currentPlayerIndex).toBeLessThan(activeOrder.length);
  expect(Object.values(state.supply.tilePool.counts).every((count) => count >= 0)).toBe(true);

  const segmentIds = new Set(state.map.segments.map((segment) => segment.id));
  expect(state.map.anchors.every((anchor) => segmentIds.has(anchor.segmentId))).toBe(true);

  const playerIds = new Set(state.players.map((player) => player.id));
  expect(Object.keys(state.turn.selectedActionTiles).every((playerId) => playerIds.has(playerId))).toBe(true);
  expect(session.actionHistory.every((record, index) => record.index === index)).toBe(true);
}

describe("session invariants", () => {
  it("在真人选牌与多步 Bot 推进后仍保持核心状态不变量", () => {
    const bot = new RandomBot(() => 0);
    let session = createGame({
      playerNames: ["Alice", "Bob", "Carol"],
      botPlayerIds: ["player-2", "player-3"],
      map: neUsaSeCanadaMap,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
      mapId: neUsaSeCanadaMap.id,
      mode: "base",
    });

    expectSessionInvariants(session);

    session = applyAction(session, {
      type: "select-action-tile",
      playerId: "player-1",
      tileId: "turn-order",
    });
    expectSessionInvariants(session);

    for (let step = 0; step < 16; step += 1) {
      const currentPlayer = selectCurrentPlayer(session);
      const nextSession = runBotStep(session, bot, currentPlayer.id);
      if (nextSession === session) {
        break;
      }
      session = nextSession;
      expectSessionInvariants(session);
    }
  });
});
