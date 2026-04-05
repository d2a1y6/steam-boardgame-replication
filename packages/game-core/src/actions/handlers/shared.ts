/**
 * 功能概述：集中放置动作处理器共用的日志、历史、玩家替换与阶段推进辅助函数。
 * 输入输出：输入会话或状态对象；输出追加日志后的状态、当前行动者信息或新的会话历史。
 * 处理流程：把 `applyAction` 里跨分支复用的公共逻辑抽出来，避免单文件继续膨胀。
 */

import type { GameAction } from "../../state/actionTypes";
import type { GameLogEntry, GameState, PlayerState } from "../../state/gameState";
import type { EngineSession, SessionActionRecord } from "../../contracts/engine";
import { advancePhase, advancePlayerPhase, enterPhase } from "../phaseMachine";
import { getWorkingState } from "../draftSession";
import { replaceAt } from "../../utils";

export function createLog(kind: GameLogEntry["kind"], message: string): GameLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    message,
  };
}

export function appendLog(state: GameState, kind: GameLogEntry["kind"], message: string): GameState {
  return {
    ...state,
    logs: [...state.logs, createLog(kind, message)],
  };
}

export function summarizeAction(action: GameAction): string {
  switch (action.type) {
    case "select-action-tile":
      return `${action.playerId} 选择行动牌 ${action.tileId}${action.usePassOption ? "（Pass）" : ""}`;
    case "perform-city-growth":
      return `${action.playerId} 对 ${action.cityHexId} 执行 City Growth`;
    case "perform-urbanization":
      return `${action.playerId} 在 ${action.townHexId} 执行 Urbanization`;
    case "place-track":
      return `${action.playerId} 在 ${action.hexId} 铺设 ${action.tileId}（旋转 ${action.rotation}）`;
    case "finish-build":
      return `${action.playerId} 结束建轨`;
    case "deliver-goods":
      return `${action.playerId} 执行运输候选 ${action.candidateId}`;
    case "choose-track-points-destination":
      return `${action.playerId} 选择将线路分加到${action.destination === "income" ? "收入" : "胜利点"}`;
    case "upgrade-locomotive":
      return `${action.playerId} 升级机车`;
    case "pass-move":
      return `${action.playerId} 跳过当前货运轮次`;
    case "buy-capital":
      return `${action.playerId} 购买资本 ${action.steps * 5}`;
    case "place-auction-bid":
      return `${action.playerId} 竞拍出价 ${action.bid}`;
    case "pass-auction":
      return `${action.playerId} 在竞拍中选择 pass`;
    case "resolve-income":
      return `${action.playerId} 结算收入`;
    case "advance-turn-order":
      return "确认顺位";
    case "set-up-next-turn":
      return "进入下一回合";
  }
}

export function getActiveOrder(state: GameState): string[] {
  if (state.turn.phase === "build-track" && state.turn.buildOrder.length > 0) {
    return state.turn.buildOrder;
  }
  if (
    (state.turn.phase === "move-goods-round-1" || state.turn.phase === "move-goods-round-2" || state.turn.phase === "resolve-delivery")
    && state.turn.moveOrder?.length
  ) {
    return state.turn.moveOrder;
  }
  return state.turn.turnOrder;
}

export function getCurrentPlayerId(state: GameState): string | null {
  return getActiveOrder(state)[state.turn.currentPlayerIndex] ?? null;
}

export function getPlayerIndex(state: GameState, playerId: string): number {
  return state.players.findIndex((player) => player.id === playerId);
}

export function replacePlayer(state: GameState, playerId: string, nextPlayer: PlayerState): GameState {
  const index = getPlayerIndex(state, playerId);
  if (index < 0) {
    return state;
  }

  return {
    ...state,
    players: replaceAt(state.players, index, nextPlayer),
  };
}

export function appendHistory(
  session: EngineSession,
  action: GameAction,
  nextCommitted: GameState,
  nextDraft: EngineSession["draft"],
): EngineSession {
  const record: SessionActionRecord = {
    index: session.actionHistory.length,
    action,
    phase: nextCommitted.turn.phase,
    round: nextCommitted.turn.round,
    activePlayerId: getCurrentPlayerId(nextDraft?.working ?? nextCommitted),
    summary: summarizeAction(action),
  };

  return {
    committed: nextCommitted,
    draft: nextDraft,
    config: session.config,
    actionHistory: [...session.actionHistory, record],
  };
}

export function withOutOfTurnWarning(session: EngineSession, playerId: string): EngineSession {
  const warned = appendLog(getWorkingState(session), "warning", `当前不是 ${playerId} 的行动时机。`);
  return session.draft
    ? {
        committed: session.committed,
        draft: {
          ...session.draft,
          working: warned,
        },
        config: session.config,
        actionHistory: session.actionHistory,
      }
    : {
        committed: warned,
        draft: null,
        config: session.config,
        actionHistory: session.actionHistory,
      };
}

export function advancePlayerInBuildPhase(state: GameState): GameState {
  if (state.turn.currentPlayerIndex < getActiveOrder(state).length - 1) {
    const nextPlayerId = getActiveOrder(state)[state.turn.currentPlayerIndex + 1]!;
    return {
      ...state,
      turn: {
        ...state.turn,
        currentPlayerIndex: state.turn.currentPlayerIndex + 1,
        buildAllowanceRemaining: state.turn.selectedActionTiles[nextPlayerId] === "engineer" ? 4 : 3,
      },
    };
  }

  return enterPhase(state, "move-goods-round-1");
}

export function nextMovePhase(state: GameState): "move-goods-round-2" | "income" {
  return state.turn.phase === "move-goods-round-1" ? "move-goods-round-2" : "income";
}

export function advanceMovePlayer(state: GameState, nextPhase: "move-goods-round-2" | "income"): GameState {
  return advancePlayerPhase(state, nextPhase);
}

export function resolveIncomePhase(state: GameState): GameState {
  return advancePhase(state);
}

export function advanceTurnOrderPhase(state: GameState): GameState {
  return advancePhase(state);
}
