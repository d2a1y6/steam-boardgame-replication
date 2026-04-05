/**
 * 功能概述：处理货运阶段的运货、机车升级与跳过动作。
 * 输入输出：输入当前正式状态和动作；输出更新后的正式状态。
 * 处理流程：计算得分与货物流向、更新玩家机车等级或直接推进货运轮次。
 */

import type { GameAction } from "../../state/actionTypes";
import type { GoodsColor } from "../../contracts/domain";
import type { DeliveryCandidate, GameState } from "../../state/gameState";
import { ensureCashForImmediateCost } from "../../rules/finance";
import { getDeliveryCandidates } from "../../rules/goodsDelivery";
import { appendLog, advanceMovePlayer, nextMovePhase, replacePlayer } from "./shared";

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

/**
 * 功能：执行一条合法运货方案。
 * 参数：`state` 是当前正式状态，`action` 是运货动作。
 * 返回：进入下一位玩家或下一货运轮的正式状态。
 * 逻辑：先找候选方案，再更新得分和货物分布，最后推进货运阶段。
 */
export function deliverGoods(
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
    advanceMovePlayer(nextState, nextMovePhase(state)),
    "action",
    `${actingPlayer.name} 将 ${candidate.goodsColor} 货物从 ${candidate.sourceHexId} 运到 ${candidate.destinationHexId}。${payoutText ? ` 线路得分：${payoutText}。` : ""}`,
  );
}

/**
 * 功能：升级当前行动玩家的机车等级。
 * 参数：`state` 是当前正式状态，`playerId` 是行动玩家。
 * 返回：进入下一位玩家或下一货运轮的正式状态。
 * 逻辑：支付升级费用、提高机车等级，并标记本回合已经升级过。
 */
export function upgradeLocomotive(state: GameState, playerId: string): GameState {
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
    ...appendLog(
      advanceMovePlayer(nextState, nextMovePhase(state)),
      "action",
      `${player.name} 将机车升级到 ${player.locomotiveLevel + 1} 级。`,
    ),
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
 * 功能：跳过当前货运轮次。
 * 参数：`state` 是当前正式状态，`playerId` 是行动玩家。
 * 返回：推进后的正式状态。
 * 逻辑：不改动其他资源，只记录日志并推进货运轮次。
 */
export function passMove(state: GameState, playerId: string): GameState {
  return appendLog(
    advanceMovePlayer(state, nextMovePhase(state)),
    "info",
    `${playerId} 放弃本轮货运。`,
  );
}
