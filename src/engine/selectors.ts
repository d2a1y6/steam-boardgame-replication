/**
 * 功能概述：把正式局面整理成给 UI、Bot 和测试使用的只读摘要。
 * 输入输出：输入引擎会话，输出阶段提示、当前玩家和可用动作列表。
 * 处理流程：只读地读取正式状态，不修改任何游戏数据。
 */

import { ACTION_TILE_DEFINITIONS } from "../data/setup/actionTiles";
import type { DeliveryCandidate } from "../state/gameState";
import type { GameState, PlayerState } from "../state/gameState";
import type { EngineSession, ActionOption, PhaseSummary } from "./types";
import { getWorkingState } from "./draftSession";
import { getDeliveryCandidates } from "../rules/goodsDelivery";
import { rankDeliveryCandidates } from "../rules/routeRanking";

const PHASE_LABELS: Record<string, string> = {
  "select-action": "选择行动牌",
  "build-track": "建轨阶段",
  "move-goods-round-1": "货运阶段 1",
  "move-goods-round-2": "货运阶段 2",
  income: "收入结算",
  "determine-order": "确认顺位",
  "set-up-next-turn": "准备下一回合",
  finished: "游戏结束",
};

function selectedTileLabel(tileId: string | null): string | undefined {
  return ACTION_TILE_DEFINITIONS.find((tile) => tile.id === tileId)?.label;
}

function currentOrder(state: GameState): string[] {
  if (state.turn.phase === "build-track" && state.turn.buildOrder.length > 0) {
    return state.turn.buildOrder;
  }
  return state.turn.turnOrder;
}

export function selectCurrentState(session: EngineSession): GameState {
  return getWorkingState(session);
}

export function selectCommittedState(session: EngineSession): GameState {
  return session.committed;
}

export function selectCurrentPlayer(session: EngineSession): PlayerState {
  const state = getWorkingState(session);
  const currentPlayerId = currentOrder(state)[state.turn.currentPlayerIndex];
  return state.players.find((player) => player.id === currentPlayerId) ?? state.players[0]!;
}

export function selectPhaseSummary(session: EngineSession): PhaseSummary {
  const state = getWorkingState(session);
  const activePlayer = selectCurrentPlayer(session);

  return {
    phaseLabel: PHASE_LABELS[state.turn.phase] ?? state.turn.phase,
    roundLabel: `第 ${state.turn.round} / ${state.turn.finalRound} 回合`,
    activePlayerLabel: activePlayer ? `${activePlayer.name}（${activePlayer.color}）` : "无",
    actionLabel: selectedTileLabel(state.turn.selectedActionTiles[activePlayer.id] ?? null),
  };
}

export function selectActionOptions(session: EngineSession): readonly ActionOption[] {
  const state = getWorkingState(session);
  const options: ActionOption[] = [];

  if (state.turn.phase === "select-action") {
    for (const tile of ACTION_TILE_DEFINITIONS) {
      options.push({
        id: tile.id,
        label: tile.label,
        description: `选择 ${tile.label} 行动牌`,
        disabled: Object.values(state.turn.selectedActionTiles).includes(tile.id),
      });
    }
    return options;
  }

  if (state.turn.phase === "build-track") {
    options.push(
      { id: "place-track", label: "铺轨", description: "在合法六边格上放置轨道板" },
      { id: "upgrade-locomotive", label: "升级机车", description: "提高机车等级" },
      { id: "finish-build", label: "结束建轨", description: "提交草稿并进入下一阶段" },
    );
    return options;
  }

  if (state.turn.phase === "move-goods-round-1" || state.turn.phase === "move-goods-round-2") {
    options.push(
      { id: "deliver-goods", label: "运货", description: "选择一条合法运输方案" },
      { id: "pass-move", label: "跳过", description: "本轮不运货" },
      { id: "resolve-income", label: "结束货运阶段", description: "结算收入并进入下一阶段" },
    );
    return options;
  }

  if (state.turn.phase === "income") {
    options.push({
      id: "resolve-income",
      label: "结算收入",
      description: "结算本回合所有玩家的收入",
    });
  } else if (state.turn.phase === "determine-order") {
    options.push({
      id: "advance-turn-order",
      label: "确认顺位",
      description: "推进到下一阶段",
    });
  } else if (state.turn.phase === "set-up-next-turn") {
    options.push({
      id: "set-up-next-turn",
      label: "开始下一回合",
      description: "进入下一回合的行动牌选择",
    });
  }

  return options;
}

export function getRankedDeliveryCandidates(game: GameState, playerId: string, limit = 3): DeliveryCandidate[] {
  return rankDeliveryCandidates(getDeliveryCandidates(game, playerId), limit);
}
