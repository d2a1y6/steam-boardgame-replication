/**
 * 功能概述：把一条游戏动作应用到当前引擎会话上，形成第一阶段最小闭环。
 * 输入输出：输入引擎会话与一条 GameAction；输出更新后的引擎会话。
 * 处理流程：先校验当前行动玩家和阶段，再分别处理选牌、建轨、运货、升级、收入与回合推进。
 */

import type { GameAction } from "../state/actionTypes";
import type { ActionTileId } from "../data/setup/actionTiles";
import type { GoodsColor } from "../data/setup/goods";
import type { DeliveryCandidate, GameLogEntry, GameState, PlayerState, TrackPieceState } from "../state/gameState";
import { addAnchor } from "../rules/tokenAnchors";
import { ensureCashForImmediateCost, resolveIncome } from "../rules/finance";
import { getDeliveryCandidates } from "../rules/goodsDelivery";
import { rebuildTrackOwnership } from "../rules/trackOwnership";
import { canPlaceTrack } from "../rules/trackPlacement";
import { takeTile } from "../rules/tilePool";
import type { EngineSession } from "./types";
import { commitDraft, ensureDraft, getWorkingState, updateDraftWorking } from "./draftSession";
import { advancePhase, advancePlayerPhase, enterPhase } from "./phaseMachine";
import { cloneState, replaceAt } from "./utils";

function createLog(kind: GameLogEntry["kind"], message: string): GameLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    message,
  };
}

function appendLog(state: GameState, kind: GameLogEntry["kind"], message: string): GameState {
  return {
    ...state,
    logs: [...state.logs, createLog(kind, message)],
  };
}

function getPlayerIndex(state: GameState, playerId: string): number {
  return state.players.findIndex((player) => player.id === playerId);
}

function getActiveOrder(state: GameState): string[] {
  if (state.turn.phase === "build-track" && state.turn.buildOrder.length > 0) {
    return state.turn.buildOrder;
  }
  return state.turn.turnOrder;
}

function getCurrentPlayerId(state: GameState): string | null {
  return getActiveOrder(state)[state.turn.currentPlayerIndex] ?? null;
}

function replacePlayer(state: GameState, playerId: string, nextPlayer: PlayerState): GameState {
  const index = getPlayerIndex(state, playerId);
  if (index < 0) {
    return state;
  }

  return {
    ...state,
    players: replaceAt(state.players, index, nextPlayer),
  };
}

function advancePlayerInBuildPhase(state: GameState): GameState {
  if (state.turn.currentPlayerIndex < getActiveOrder(state).length - 1) {
    return {
      ...state,
      turn: {
        ...state.turn,
        currentPlayerIndex: state.turn.currentPlayerIndex + 1,
        buildAllowanceRemaining: 3,
      },
    };
  }

  return enterPhase(state, "move-goods-round-1");
}

function advanceMovePlayer(state: GameState, nextPhase: "move-goods-round-2" | "income"): GameState {
  return advancePlayerPhase(state, nextPhase);
}

function nextMovePhase(state: GameState): "move-goods-round-2" | "income" {
  return state.turn.phase === "move-goods-round-1" ? "move-goods-round-2" : "income";
}

function setSelectedActionTile(state: GameState, playerId: string, tileId: ActionTileId): GameState {
  if (Object.values(state.turn.selectedActionTiles).includes(tileId)) {
    return appendLog(state, "warning", `行动牌 ${tileId} 已被选择。`);
  }

  const nextState = {
    ...state,
    turn: {
      ...state.turn,
      selectedActionTiles: {
        ...state.turn.selectedActionTiles,
        [playerId]: tileId,
      },
    },
  };

  const allSelected = nextState.players.every((player) => nextState.turn.selectedActionTiles[player.id] != null);
  if (allSelected) {
    return enterPhase(
      appendLog(nextState, "action", `${playerId} 选择了行动牌 ${tileId}。`),
      "build-track",
    );
  }

  return {
    ...appendLog(nextState, "action", `${playerId} 选择了行动牌 ${tileId}。`),
    turn: {
      ...nextState.turn,
      currentPlayerIndex: Math.min(nextState.turn.currentPlayerIndex + 1, nextState.players.length - 1),
    },
  };
}

function placeTrackInDraft(state: GameState, action: Extract<GameAction, { type: "place-track" }>): GameState {
  if (state.turn.buildAllowanceRemaining <= 0) {
    return appendLog(state, "warning", "当前玩家本阶段的建轨额度已经用完。");
  }

  const player = state.players.find((item) => item.id === action.playerId);
  if (!player) {
    return appendLog(state, "warning", "找不到建轨玩家。");
  }

  const placementCheck = canPlaceTrack({
    map: state.map,
    player,
    tilePool: state.supply.tilePool,
    hexId: action.hexId,
    tileId: action.tileId,
    rotation: action.rotation,
  });
  if (!placementCheck.ok || placementCheck.cost == null) {
    return appendLog(state, "warning", placementCheck.reason ?? "建轨失败。");
  }

  const paid = ensureCashForImmediateCost(player, placementCheck.cost);
  const nextPlayer = paid.player;
  const nextTrack: TrackPieceState = {
    id: `track-${state.map.trackPieces.length + 1}`,
    hexId: action.hexId,
    tileId: action.tileId,
    ownerId: action.playerId,
    rotation: action.rotation,
  };

  let nextState: GameState = replacePlayer(state, action.playerId, nextPlayer);
  nextState = {
    ...nextState,
    map: {
      ...nextState.map,
      trackPieces: [...nextState.map.trackPieces, nextTrack],
    },
    supply: {
      ...nextState.supply,
      tilePool: takeTile(nextState.supply.tilePool, action.tileId),
    },
    turn: {
      ...nextState.turn,
      buildAllowanceRemaining: Math.max(0, nextState.turn.buildAllowanceRemaining - 1),
    },
  };

  nextState = {
    ...nextState,
    map: rebuildTrackOwnership(nextState.map),
  };

  if (placementCheck.startsNewLink && nextState.map.segments.length > 0) {
    const lastSegment = nextState.map.segments[nextState.map.segments.length - 1]!;
    nextState = {
      ...nextState,
      map: rebuildTrackOwnership({
        ...nextState.map,
        anchors: addAnchor(nextState.map.anchors, action.playerId, lastSegment.id),
      }),
    };
  }

  return appendLog(
    nextState,
    "action",
    `${player.name} 在 ${action.hexId} 铺设了 ${action.tileId}，费用 ${placementCheck.cost}。`,
  );
}

function findDeliveryCandidate(state: GameState, playerId: string, candidateId: string): DeliveryCandidate | null {
  return getDeliveryCandidates(state, playerId).find((candidate) => candidate.id === candidateId) ?? null;
}

function removeFirstCube(cubes: readonly GoodsColor[], color: GoodsColor): GoodsColor[] {
  const index = cubes.findIndex((cube) => cube === color);
  if (index < 0) {
    return [...cubes];
  }

  return cubes.filter((_, cubeIndex) => cubeIndex !== index);
}

function deliverGoods(state: GameState, action: Extract<GameAction, { type: "deliver-goods" }>): GameState {
  const candidate = findDeliveryCandidate(state, action.playerId, action.candidateId);
  if (!candidate) {
    return appendLog(state, "warning", "未找到合法运货方案。");
  }

  const actingPlayer = state.players.find((item) => item.id === action.playerId);
  if (!actingPlayer) {
    return appendLog(state, "warning", "找不到运货玩家。");
  }

  const nextPlayers = state.players.map((player) => ({
    ...player,
    victoryPoints: player.victoryPoints + (candidate.pointsByOwner[player.id] ?? 0),
  }));

  const nextState: GameState = {
    ...state,
    players: nextPlayers,
    map: {
      ...state.map,
      cityGoods: {
        ...state.map.cityGoods,
        [candidate.sourceHexId]: removeFirstCube(state.map.cityGoods[candidate.sourceHexId] ?? [], candidate.goodsColor),
      },
    },
  };

  const payoutText = Object.entries(candidate.pointsByOwner)
    .map(([ownerId, points]) => {
      const playerName = nextPlayers.find((player) => player.id === ownerId)?.name ?? ownerId;
      return `${playerName}+${points}`;
    })
    .join("，");

  return appendLog(
    nextState,
    "action",
    `${actingPlayer.name} 将 ${candidate.goodsColor} 货物从 ${candidate.sourceHexId} 运到 ${candidate.destinationHexId}。${payoutText ? ` 线路得分：${payoutText}。` : ""}`,
  );
}

function upgradeLocomotive(state: GameState, playerId: string): GameState {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    return appendLog(state, "warning", "找不到升级机车的玩家。");
  }

  const upgraded = ensureCashForImmediateCost(player, state.ruleset.actionCosts.locomotiveBase);
  const nextState = replacePlayer(state, playerId, {
    ...upgraded.player,
    locomotiveLevel: upgraded.player.locomotiveLevel + 1,
  });

  return {
    ...appendLog(nextState, "action", `${player.name} 将机车升级到 ${player.locomotiveLevel + 1} 级。`),
    turn: {
      ...nextState.turn,
      upgradedThisTurn: {
        ...nextState.turn.upgradedThisTurn,
        [playerId]: true,
      },
    },
  };
}

/**
 * 功能：把一条动作应用到引擎会话。
 * 参数：`session` 是当前会话，`action` 是一条显式动作。
 * 返回：更新后的会话；对建轨会保留 draft，其余阶段直接更新 committed。
 * 逻辑：先验证当前行动者，再按动作类型分派到具体规则处理函数。
 */
export function applyAction(session: EngineSession, action: GameAction): EngineSession {
  const state = getWorkingState(session);
  const currentPlayerId = getCurrentPlayerId(state);

  if ("playerId" in action && action.playerId !== currentPlayerId) {
    const warned = appendLog(state, "warning", `当前不是 ${action.playerId} 的行动时机。`);
    return session.draft
      ? {
          committed: session.committed,
          draft: {
            ...session.draft,
            working: warned,
          },
        }
      : {
          committed: warned,
          draft: null,
        };
  }

  switch (action.type) {
    case "select-action-tile":
      return {
        committed: setSelectedActionTile(cloneState(session.committed), action.playerId, action.tileId),
        draft: null,
      };

    case "place-track":
      return updateDraftWorking(session, (working) => placeTrackInDraft(working, action));

    case "finish-build": {
      const committed = commitDraft(session).committed;
      return {
        committed: advancePlayerInBuildPhase(committed),
        draft: null,
      };
    }

    case "deliver-goods":
      return {
        committed: advanceMovePlayer(deliverGoods(cloneState(session.committed), action), nextMovePhase(state)),
        draft: null,
      };

    case "upgrade-locomotive":
      return {
        committed: advanceMovePlayer(upgradeLocomotive(cloneState(session.committed), action.playerId), nextMovePhase(state)),
        draft: null,
      };

    case "pass-move":
      return {
        committed: appendLog(
          advanceMovePlayer(cloneState(session.committed), state.turn.phase === "move-goods-round-1" ? "move-goods-round-2" : "income"),
          "info",
          `${action.playerId} 放弃本轮货运。`,
        ),
        draft: null,
      };

    case "resolve-income":
      return {
        committed: advancePhase({
          ...cloneState(session.committed),
          players: cloneState(session.committed.players).map((player) => resolveIncome(player)),
        }),
        draft: null,
      };

    case "advance-turn-order":
      return {
        committed: advancePhase(cloneState(session.committed)),
        draft: null,
      };

    case "set-up-next-turn":
      return {
        committed: enterPhase(cloneState(session.committed), "select-action"),
        draft: null,
      };
  }
}
