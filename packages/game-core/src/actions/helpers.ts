/**
 * 功能概述：提供动作执行层共享的日志、历史和玩家索引辅助函数。
 * 输入输出：输入会话或状态片段；输出更新后的日志对象、历史记录或玩家定位结果。
 * 处理流程：把多个动作处理器都会复用的辅助逻辑收口，减少总控文件重复实现。
 */

import type { GameAction } from "../state/actionTypes";
import type { GameLogEntry, GameState, PlayerState } from "../state/gameState";
import type { EngineSession, SessionActionRecord } from "../contracts/engine";
import { replaceAt } from "../utils";

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

function summarizeAction(action: GameAction): string {
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

export function getCurrentPlayerId(state: GameState): string | null {
  const order =
    state.turn.phase === "build-track" && state.turn.buildOrder.length > 0
      ? state.turn.buildOrder
      : (state.turn.phase === "move-goods-round-1"
        || state.turn.phase === "move-goods-round-2"
        || state.turn.phase === "resolve-delivery")
        && state.turn.moveOrder?.length
        ? state.turn.moveOrder
      : state.turn.turnOrder;
  return order[state.turn.currentPlayerIndex] ?? null;
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

export function replacePlayer(state: GameState, playerId: string, nextPlayer: PlayerState): GameState {
  const index = state.players.findIndex((player) => player.id === playerId);
  if (index < 0) {
    return state;
  }

  return {
    ...state,
    players: replaceAt(state.players, index, nextPlayer),
  };
}
