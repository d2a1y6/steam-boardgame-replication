/**
 * 功能概述：统一维护基础版与标准版的阶段推进、顺位重排与阶段重置。
 * 输入输出：输入当前正式状态；输出切到下一阶段后的正式状态。
 * 处理流程：先根据规则集决定阶段序列，再为每个阶段准备顺位、额度、竞拍或待决结算状态。
 */

import type { ActionTileId } from "../contracts/domain";
import type { AuctionState, GameState, TurnPhase } from "../state/gameState";
import { cloneState } from "../utils";

function createPhaseLog(state: GameState, message: string): GameState {
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

function getSelectedTile(state: GameState, playerId: string): ActionTileId | null {
  return state.turn.selectedActionTiles[playerId] ?? null;
}

function getActionTileValue(state: GameState, playerId: string) {
  const tileId = getSelectedTile(state, playerId);
  return state.content.actionTiles.find((tile) => tile.id === tileId)?.value ?? 99;
}

function buildPriorityOrder(state: GameState, specialTileId: ActionTileId | null) {
  const baseOrder = [...state.turn.turnOrder];
  if (!specialTileId) {
    return baseOrder;
  }

  const specialPlayerId = baseOrder.find((playerId) => getSelectedTile(state, playerId) === specialTileId);
  if (!specialPlayerId) {
    return baseOrder;
  }

  return [specialPlayerId, ...baseOrder.filter((playerId) => playerId !== specialPlayerId)];
}

function buildNextTurnOrder(state: GameState) {
  const selectedEntries = state.players.map((player) => ({
    playerId: player.id,
    tileId: getSelectedTile(state, player.id),
    value: getActionTileValue(state, player.id),
  }));

  const turnOrderPlayerId = selectedEntries.find((entry) => entry.tileId === "turn-order")?.playerId ?? null;
  const remaining = selectedEntries
    .filter((entry) => entry.playerId !== turnOrderPlayerId)
    .sort((left, right) => {
      if (left.value !== right.value) {
        return left.value - right.value;
      }
      return state.turn.turnOrder.indexOf(left.playerId) - state.turn.turnOrder.indexOf(right.playerId);
    })
    .map((entry) => entry.playerId);

  return turnOrderPlayerId ? [turnOrderPlayerId, ...remaining] : remaining;
}

function getBuildAllowance(state: GameState, playerId: string) {
  return getSelectedTile(state, playerId) === "engineer" ? 4 : 3;
}

function resetActionSelection(state: GameState, nextPhase: TurnPhase): GameState {
  const round =
    state.turn.phase === "set-up-next-turn"
      ? Math.min(state.turn.round + 1, state.turn.finalRound)
      : state.turn.round;
  const bonusAuctionPassPlayerId =
    nextPhase === "buy-capital"
      ? state.players.find((player) => getSelectedTile(state, player.id) === "turn-order")?.id ?? null
      : state.turn.bonusAuctionPassPlayerId ?? null;

  return createPhaseLog(
    {
      ...state,
      turn: {
        ...state.turn,
        round,
        phase: nextPhase,
        currentPlayerIndex: 0,
        buildOrder: [...state.turn.turnOrder],
        moveOrder: [...state.turn.turnOrder],
        selectedActionTiles: Object.fromEntries(state.players.map((player) => [player.id, null])),
        passedActionTiles: Object.fromEntries(state.players.map((player) => [player.id, false])),
        pendingBuildActions: Object.fromEntries(state.players.map((player) => [player.id, null])),
        buildAllowanceRemaining: 3,
        moveActionsTaken: Object.fromEntries(state.players.map((player) => [player.id, 0])),
        upgradedThisTurn: Object.fromEntries(state.players.map((player) => [player.id, false])),
        pendingDeliveryResolution: null,
        auctionState: null,
        capitalBoughtThisTurn: Object.fromEntries(state.players.map((player) => [player.id, 0])),
        bonusAuctionPassPlayerId,
      },
    },
    nextPhase === "buy-capital" ? "进入买资本阶段" : "进入行动牌选择阶段",
  );
}

function resetForBuildPhase(state: GameState): GameState {
  const buildOrder = buildPriorityOrder(state, "first-build");
  const firstPlayerId = buildOrder[0] ?? state.turn.turnOrder[0] ?? null;

  return createPhaseLog(
    {
      ...state,
      turn: {
        ...state.turn,
        phase: "build-track",
        currentPlayerIndex: 0,
        buildOrder,
        moveOrder: buildPriorityOrder(state, "first-move"),
        buildAllowanceRemaining: firstPlayerId ? getBuildAllowance(state, firstPlayerId) : 3,
      },
    },
    "进入建轨阶段",
  );
}

function resetForMovePhase(state: GameState, phase: "move-goods-round-1" | "move-goods-round-2"): GameState {
  const moveOrder = state.turn.moveOrder?.length ? [...state.turn.moveOrder] : buildPriorityOrder(state, "first-move");
  return createPhaseLog(
    {
      ...state,
      turn: {
        ...state.turn,
        phase,
        currentPlayerIndex: 0,
        moveOrder,
        pendingDeliveryResolution: null,
      },
    },
    phase === "move-goods-round-1" ? "进入货运第 1 轮" : "进入货运第 2 轮",
  );
}

function initializeAuctionState(state: GameState): AuctionState {
  const bonusPassPlayerId = state.turn.bonusAuctionPassPlayerId ?? null;
  return {
    currentBid: -1,
    leaderPlayerId: null,
    playerBids: Object.fromEntries(state.players.map((player) => [player.id, 0])),
    passedPlayerIds: [],
    finalOrder: [],
    bonusPassPlayerId,
    bonusPassUsedByPlayer: Object.fromEntries(state.players.map((player) => [player.id, false])),
  };
}

export function getNextPhase(state: GameState): TurnPhase {
  if (state.turn.phase === "income" && state.turn.round >= state.turn.finalRound) {
    return "finished";
  }

  const phaseOrder = state.ruleset.phaseOrder as TurnPhase[];
  const currentIndex = phaseOrder.indexOf(state.turn.phase);
  if (currentIndex < 0 || currentIndex === phaseOrder.length - 1) {
    return state.ruleset.mode === "standard" ? "buy-capital" : "select-action";
  }
  return phaseOrder[currentIndex + 1]!;
}

export function enterPhase(state: GameState, phase: TurnPhase): GameState {
  const nextState = cloneState(state);

  switch (phase) {
    case "buy-capital":
      return resetActionSelection(nextState, "buy-capital");
    case "auction-turn-order":
      return createPhaseLog(
        {
          ...nextState,
          turn: {
            ...nextState.turn,
            phase: "auction-turn-order",
            currentPlayerIndex: 0,
            auctionState: initializeAuctionState(nextState),
          },
        },
        "进入标准版顺位竞拍阶段",
      );
    case "select-action":
      return resetActionSelection(nextState, "select-action");
    case "build-track":
      return resetForBuildPhase(nextState);
    case "move-goods-round-1":
      return resetForMovePhase(nextState, "move-goods-round-1");
    case "move-goods-round-2":
      return resetForMovePhase(nextState, "move-goods-round-2");
    case "resolve-delivery":
      return createPhaseLog(
        {
          ...nextState,
          turn: {
            ...nextState.turn,
            phase: "resolve-delivery",
          },
        },
        "进入运输得分分配阶段",
      );
    case "income":
      return createPhaseLog(
        {
          ...nextState,
          turn: {
            ...nextState.turn,
            phase: "income",
            currentPlayerIndex: 0,
          },
        },
        "进入收入与支出阶段",
      );
    case "determine-order":
      return createPhaseLog(
        {
          ...nextState,
          turn: {
            ...nextState.turn,
            phase: "determine-order",
            currentPlayerIndex: 0,
            turnOrder: buildNextTurnOrder(nextState),
          },
        },
        "已根据行动牌确定下一回合顺位",
      );
    case "set-up-next-turn":
      return createPhaseLog(
        {
          ...nextState,
          turn: {
            ...nextState.turn,
            phase: "set-up-next-turn",
            currentPlayerIndex: 0,
            buildOrder: [...nextState.turn.turnOrder],
            moveOrder: [...nextState.turn.turnOrder],
            buildAllowanceRemaining: 3,
            pendingDeliveryResolution: null,
            auctionState: null,
          },
        },
        "进入下一回合准备阶段",
      );
    case "finished":
      return createPhaseLog(
        {
          ...nextState,
          turn: {
            ...nextState.turn,
            phase: "finished",
            pendingDeliveryResolution: null,
          },
        },
        "游戏结束",
      );
  }
}

export function advancePhase(state: GameState): GameState {
  return enterPhase(state, getNextPhase(state));
}

function getActiveOrder(state: GameState): string[] {
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

export function advancePlayerPhase(state: GameState, nextPhaseWhenFinished: TurnPhase): GameState {
  const activeOrder = getActiveOrder(state);
  if (state.turn.currentPlayerIndex < activeOrder.length - 1) {
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
  const activeOrder = getActiveOrder(state);
  if (state.turn.currentPlayerIndex < activeOrder.length - 1) {
    const nextPlayerId = activeOrder[state.turn.currentPlayerIndex + 1]!;
    return {
      ...state,
      turn: {
        ...state.turn,
        currentPlayerIndex: state.turn.currentPlayerIndex + 1,
        buildAllowanceRemaining: getBuildAllowance(state, nextPlayerId),
      },
    };
  }

  return enterPhase(state, "move-goods-round-1");
}

export function nextMovePhase(state: GameState): TurnPhase {
  return state.turn.phase === "move-goods-round-1" ? "move-goods-round-2" : "income";
}
