/**
 * 功能概述：处理 Steam 基础版第一部分的阶段推进。
 * 输入输出：输入正式状态，输出推进到下一个阶段后的正式状态。
 * 处理流程：维护行动牌选择、建轨、两轮货运、收入与回合切换的最小闭环。
 */

import type { ActionTileId } from "../contracts/domain";
import type { GameState } from "../state/gameState";
import { cloneState } from "../utils";

export const PHASE_SEQUENCE = [
  "select-action",
  "build-track",
  "move-goods-round-1",
  "move-goods-round-2",
  "income",
  "determine-order",
  "set-up-next-turn",
] as const;

type PhaseName = (typeof PHASE_SEQUENCE)[number];

function pushLog(state: GameState, message: string): GameState {
  return {
    ...state,
    logs: [
      ...state.logs,
      {
        id: `log-${state.logs.length + 1}`,
        kind: "info",
        message,
      },
    ],
  };
}

function resetActionSelection(state: GameState): GameState {
  return {
    ...state,
    turn: {
      ...state.turn,
      currentPlayerIndex: 0,
      buildAllowanceRemaining: 3,
      buildOrder: state.players.map((player) => player.id),
      turnOrder: state.players.map((player) => player.id),
      selectedActionTiles: Object.fromEntries(state.players.map((player) => [player.id, null])),
      moveActionsTaken: Object.fromEntries(state.players.map((player) => [player.id, 0])),
      upgradedThisTurn: Object.fromEntries(state.players.map((player) => [player.id, false])),
      phase: "select-action",
    },
    logs: [
      ...state.logs,
      {
        id: `log-${state.logs.length + 1}`,
        kind: "info",
        message: "进入行动牌选择阶段",
      },
    ],
  };
}

function resetForBuildPhase(state: GameState): GameState {
  const buildOrder = [...state.players]
    .sort((left, right) => {
      const leftPriority = state.content.actionTiles.find((tile) => tile.id === state.turn.selectedActionTiles[left.id])?.value ?? 99;
      const rightPriority = state.content.actionTiles.find((tile) => tile.id === state.turn.selectedActionTiles[right.id])?.value ?? 99;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.id.localeCompare(right.id);
    })
    .map((player) => player.id);
  return {
    ...state,
    turn: {
      ...state.turn,
      currentPlayerIndex: 0,
      buildAllowanceRemaining: 3,
      buildOrder,
      turnOrder: buildOrder,
      phase: "build-track",
    },
    logs: [
      ...state.logs,
      {
        id: `log-${state.logs.length + 1}`,
        kind: "info",
        message: "行动牌选择完成，进入建轨阶段",
      },
    ],
  };
}

function resetForMovePhase(state: GameState, phase: "move-goods-round-1" | "move-goods-round-2"): GameState {
  return {
    ...state,
    turn: {
      ...state.turn,
      currentPlayerIndex: 0,
      moveActionsTaken: Object.fromEntries(state.players.map((player) => [player.id, 0])),
      phase,
    },
    logs: [
      ...state.logs,
      {
        id: `log-${state.logs.length + 1}`,
        kind: "info",
        message: phase === "move-goods-round-1" ? "进入货运第 1 轮" : "进入货运第 2 轮",
      },
    ],
  };
}

function resetForIncomePhase(state: GameState): GameState {
  return {
    ...state,
    turn: {
      ...state.turn,
      currentPlayerIndex: 0,
      phase: "income",
    },
    logs: [
      ...state.logs,
      {
        id: `log-${state.logs.length + 1}`,
        kind: "info",
        message: "已结算收入阶段",
      },
    ],
  };
}

function prepareNextTurn(state: GameState): GameState {
  return {
    ...state,
    turn: {
      ...state.turn,
      currentPlayerIndex: 0,
      buildAllowanceRemaining: 3,
      selectedActionTiles: Object.fromEntries(state.players.map((player) => [player.id, null])),
      moveActionsTaken: Object.fromEntries(state.players.map((player) => [player.id, 0])),
      upgradedThisTurn: Object.fromEntries(state.players.map((player) => [player.id, false])),
      phase: "set-up-next-turn",
    },
    logs: [
      ...state.logs,
      {
        id: `log-${state.logs.length + 1}`,
        kind: "info",
        message: "进入下一回合准备阶段",
      },
    ],
  };
}

export function getNextPhase(phase: PhaseName): PhaseName | "finished" {
  switch (phase) {
    case "select-action":
      return "build-track";
    case "build-track":
      return "move-goods-round-1";
    case "move-goods-round-1":
      return "move-goods-round-2";
    case "move-goods-round-2":
      return "income";
    case "income":
      return "determine-order";
    case "determine-order":
      return "set-up-next-turn";
    case "set-up-next-turn":
      return "select-action";
    default:
      return "finished";
  }
}

export function enterPhase(state: GameState, phase: PhaseName | "finished"): GameState {
  const nextState = cloneState(state);

  switch (phase) {
    case "select-action":
      return resetActionSelection({
        ...nextState,
        turn: {
          ...nextState.turn,
          round:
            nextState.turn.phase === "set-up-next-turn" ? Math.min(nextState.turn.round + 1, nextState.turn.finalRound) : nextState.turn.round,
        },
      });
    case "build-track":
      return resetForBuildPhase(nextState);
    case "move-goods-round-1":
      return resetForMovePhase(nextState, phase);
    case "move-goods-round-2":
      return resetForMovePhase(nextState, phase);
    case "income":
      return resetForIncomePhase(nextState);
    case "determine-order":
      return {
        ...nextState,
        turn: {
          ...nextState.turn,
          currentPlayerIndex: 0,
          turnOrder: nextState.turn.buildOrder.length > 0 ? [...nextState.turn.buildOrder] : nextState.turn.turnOrder,
          phase: "determine-order",
        },
        logs: [
          ...nextState.logs,
          {
            id: `log-${nextState.logs.length + 1}`,
            kind: "info",
            message: "进入顺位确认阶段",
          },
        ],
      };
    case "set-up-next-turn":
      return prepareNextTurn(nextState);
    case "finished":
      return {
        ...nextState,
        turn: {
          ...nextState.turn,
          phase: "finished",
        },
        logs: [
          ...nextState.logs,
          {
            id: `log-${nextState.logs.length + 1}`,
            kind: "info",
            message: "游戏结束",
          },
        ],
      };
  }
}

export function advancePhase(state: GameState): GameState {
  return enterPhase(state, getNextPhase(state.turn.phase as PhaseName));
}

export function advancePlayerPhase(state: GameState, nextPhaseWhenFinished: PhaseName): GameState {
  const turnOrderLength = state.turn.turnOrder.length || state.players.length;
  if (state.turn.currentPlayerIndex < turnOrderLength - 1) {
    return {
      ...state,
      turn: {
        ...state.turn,
        currentPlayerIndex: state.turn.currentPlayerIndex + 1,
      },
    };
  }

  return enterPhase(state, nextPhaseWhenFinished);
}

export function advancePlayerInBuildPhase(state: GameState): GameState {
  return advancePlayerPhase(
    {
      ...state,
      turn: {
        ...state.turn,
        buildAllowanceRemaining: 3,
      },
    },
    "move-goods-round-1",
  );
}

export function nextMovePhase(state: GameState): "move-goods-round-2" | "income" {
  return state.turn.phase === "move-goods-round-1" ? "move-goods-round-2" : "income";
}
