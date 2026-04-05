/**
 * 功能概述：处理标准版的买资本与顺位竞拍。
 * 输入输出：输入当前正式状态与标准版动作；输出更新后的正式状态。
 * 处理流程：先在 buy-capital 阶段逐人买资本，再在 auction-turn-order 阶段完成竞拍、支付并生成新顺位。
 */

import type { GameAction } from "../../state/actionTypes";
import type { GameState } from "../../state/gameState";
import { buyCapital as buyCapitalFromBank } from "../../rules/finance";
import { enterPhase } from "../phaseMachine";
import { appendLog } from "./shared";

function getAuctionOrder(state: GameState) {
  return state.turn.turnOrder;
}

function activeAuctionPlayers(state: GameState) {
  const passed = new Set(state.turn.auctionState?.passedPlayerIds ?? []);
  return getAuctionOrder(state).filter((playerId) => !passed.has(playerId));
}

function advanceAuctionPlayerIndex(state: GameState): GameState {
  const activePlayers = activeAuctionPlayers(state);
  if (activePlayers.length <= 1) {
    return finalizeAuction(state);
  }

  const currentPlayerId = activePlayers[(activePlayers.findIndex((id) => id === getAuctionOrder(state)[state.turn.currentPlayerIndex]) + 1) % activePlayers.length] ?? activePlayers[0]!;
  const currentPlayerIndex = getAuctionOrder(state).indexOf(currentPlayerId);
  return {
    ...state,
    turn: {
      ...state.turn,
      currentPlayerIndex,
    },
  };
}

function finalizeAuction(state: GameState): GameState {
  const auctionState = state.turn.auctionState;
  if (!auctionState) {
    return state;
  }

  const activePlayers = activeAuctionPlayers(state);
  const winnerId = auctionState.leaderPlayerId ?? activePlayers[0] ?? state.turn.turnOrder[0];
  const finalOrder = [winnerId, ...[...auctionState.finalOrder].reverse()];

  const paidPlayers = state.players.map((player) => {
    const position = finalOrder.indexOf(player.id);
    const bid = auctionState.playerBids[player.id] ?? 0;
    let cost = 0;
    if (position === 0 || position === 1) {
      cost = bid;
    } else if (position === finalOrder.length - 1) {
      cost = 0;
    } else if (position >= 0) {
      cost = Math.ceil(bid / 2);
    }
    return {
      ...player,
      cash: Math.max(0, player.cash - cost),
    };
  });

  return enterPhase(
    appendLog(
      {
        ...state,
        players: paidPlayers,
        turn: {
          ...state.turn,
          turnOrder: finalOrder,
          currentPlayerIndex: 0,
          auctionState: null,
        },
      },
      "action",
      `标准版顺位竞拍完成：${finalOrder.join(" -> ")}。`,
    ),
    "select-action",
  );
}

export function buyCapital(state: GameState, action: Extract<GameAction, { type: "buy-capital" }>): GameState {
  const player = state.players.find((item) => item.id === action.playerId);
  if (!player) {
    return appendLog(state, "warning", "找不到买资本的玩家。");
  }

  const nextPlayers = state.players.map((item) =>
    item.id === action.playerId ? buyCapitalFromBank(item, action.steps) : item,
  );
  const nextState = appendLog(
    {
      ...state,
      players: nextPlayers,
      turn: {
        ...state.turn,
        capitalBoughtThisTurn: {
          ...(state.turn.capitalBoughtThisTurn ?? {}),
          [action.playerId]: action.steps * 5,
        },
      },
    },
    "action",
    `${player.name} 在标准版买资本阶段获得 $${action.steps * 5}。`,
  );

  if (state.turn.currentPlayerIndex < state.turn.turnOrder.length - 1) {
    return {
      ...nextState,
      turn: {
        ...nextState.turn,
        currentPlayerIndex: state.turn.currentPlayerIndex + 1,
      },
    };
  }

  return enterPhase(nextState, "auction-turn-order");
}

export function placeAuctionBid(state: GameState, action: Extract<GameAction, { type: "place-auction-bid" }>): GameState {
  const auctionState = state.turn.auctionState;
  const player = state.players.find((item) => item.id === action.playerId);
  if (!auctionState || !player) {
    return appendLog(state, "warning", "当前没有可用的标准版竞拍。");
  }
  if (action.bid <= auctionState.currentBid) {
    return appendLog(state, "warning", "新的竞拍必须高于当前最高价。");
  }
  if (action.bid > player.cash) {
    return appendLog(state, "warning", "标准版竞拍不能出价超过当前现金。");
  }

  const nextState = appendLog(
    {
      ...state,
      turn: {
        ...state.turn,
        auctionState: {
          ...auctionState,
          currentBid: action.bid,
          leaderPlayerId: action.playerId,
          playerBids: {
            ...auctionState.playerBids,
            [action.playerId]: action.bid,
          },
        },
      },
    },
    "action",
    `${player.name} 在标准版竞拍中出价 $${action.bid}。`,
  );

  return advanceAuctionPlayerIndex(nextState);
}

export function passAuction(state: GameState, action: Extract<GameAction, { type: "pass-auction" }>): GameState {
  const auctionState = state.turn.auctionState;
  const player = state.players.find((item) => item.id === action.playerId);
  if (!auctionState || !player) {
    return appendLog(state, "warning", "当前没有可用的标准版竞拍。");
  }

  if (auctionState.bonusPassPlayerId === action.playerId && !auctionState.bonusPassUsedByPlayer[action.playerId]) {
    const nextState = appendLog(
      {
        ...state,
        turn: {
          ...state.turn,
          auctionState: {
            ...auctionState,
            bonusPassUsedByPlayer: {
              ...auctionState.bonusPassUsedByPlayer,
              [action.playerId]: true,
            },
          },
        },
      },
      "action",
      `${player.name} 使用了 Turn Order 的一次免费 pass。`,
    );
    return advanceAuctionPlayerIndex(nextState);
  }

  const nextState = appendLog(
    {
      ...state,
      turn: {
        ...state.turn,
        auctionState: {
          ...auctionState,
          passedPlayerIds: [...auctionState.passedPlayerIds, action.playerId],
          finalOrder: [...auctionState.finalOrder, action.playerId],
        },
      },
    },
    "action",
    `${player.name} 在标准版竞拍中选择 pass。`,
  );

  return advanceAuctionPlayerIndex(nextState);
}
