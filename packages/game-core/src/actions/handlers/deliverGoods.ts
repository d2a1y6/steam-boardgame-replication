/**
 * 功能概述：处理货运阶段的合法运货动作。
 * 输入输出：输入当前状态与运货动作；输出完成得分分配和货物移除后的新状态。
 * 处理流程：先重算候选确认合法性，再结算得分并从起点城市移除首个同色货物。
 */

import type { GoodsColor } from "../../contracts/domain";
import type { GameAction } from "../../state/actionTypes";
import type { DeliveryCandidate, GameState } from "../../state/gameState";
import { getDeliveryCandidates } from "../../rules/goodsDelivery";
import { appendLog } from "../helpers";

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

export function handleDeliverGoods(
  state: GameState,
  action: Extract<GameAction, { type: "deliver-goods" }>,
): GameState {
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
