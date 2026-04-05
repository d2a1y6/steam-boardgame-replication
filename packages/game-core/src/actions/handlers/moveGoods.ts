/**
 * 功能概述：处理货运阶段的运输、免费机车升级、放弃行动与线路分分配。
 * 输入输出：输入当前正式状态和动作；输出更新后的正式状态。
 * 处理流程：先锁定合法运输候选，再生成待决线路分队列，最后在所有选择完成后推进到下一位玩家。
 */

import type { GameAction } from "../../state/actionTypes";
import type { GoodsColor, TrackPointDestination } from "../../contracts/domain";
import type { DeliveryCandidate, GameState, PlayerState } from "../../state/gameState";
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

function applyTrackPointChoice(player: PlayerState, points: number, destination: TrackPointDestination) {
  return destination === "income"
    ? { ...player, income: player.income + points }
    : { ...player, victoryPoints: player.victoryPoints + points };
}

/**
 * 功能：执行一条合法运货方案，并在需要时进入线路分选择阶段。
 * 参数：`state` 是当前正式状态，`action` 是运货动作。
 * 返回：若无人得分则直接推进，否则进入 `resolve-delivery` 阶段。
 * 逻辑：先把货物从地图上移走，再为所有得分玩家生成按规则顺序排列的选择队列。
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

  const nextState: GameState = {
    ...state,
    map: {
      ...state.map,
      cityGoods: {
        ...state.map.cityGoods,
        [candidate.sourceHexId]: removeFirstCube(state.map.cityGoods[candidate.sourceHexId] ?? [], candidate.goodsColor),
      },
    },
  };

  const moveOrder = state.turn.moveOrder?.length ? state.turn.moveOrder : state.turn.turnOrder;
  const queue = [
    { playerId: actingPlayer.id, points: candidate.pointsByOwner[actingPlayer.id] ?? 0 },
    ...moveOrder
      .filter((playerId) => playerId !== actingPlayer.id)
      .map((playerId) => ({ playerId, points: candidate.pointsByOwner[playerId] ?? 0 })),
  ].filter((entry) => entry.points > 0);

  const payoutText = Object.entries(candidate.pointsByOwner)
    .map(([ownerId, points]) => {
      const playerName = state.players.find((player) => player.id === ownerId)?.name ?? ownerId;
      return `${playerName}+${points}`;
    })
    .join("，");

  if (queue.length === 0) {
    return appendLog(
      advanceMovePlayer(nextState, nextMovePhase(state)),
      "action",
      `${actingPlayer.name} 将 ${candidate.goodsColor} 货物从 ${candidate.sourceHexId} 运到 ${candidate.destinationHexId}。`,
    );
  }

  const firstDecisionPlayerId = queue[0]!.playerId;
  return appendLog(
    {
      ...nextState,
      turn: {
        ...nextState.turn,
        phase: "resolve-delivery",
        currentPlayerIndex: moveOrder.indexOf(firstDecisionPlayerId),
        pendingDeliveryResolution: {
          candidate,
          queue,
          resolvedChoices: {},
          sourcePhase: state.turn.phase as "move-goods-round-1" | "move-goods-round-2",
        },
      },
    },
    "action",
    `${actingPlayer.name} 将 ${candidate.goodsColor} 货物从 ${candidate.sourceHexId} 运到 ${candidate.destinationHexId}。线路分：${payoutText}。`,
  );
}

/**
 * 功能：为当前待决的线路分选择收入或胜利点去向。
 * 参数：`state` 是当前正式状态，`playerId` 是正在做决定的玩家，`destination` 指向收入或胜利点。
 * 返回：更新后的正式状态；若所有人都选完，则自动回到货运阶段继续推进。
 * 逻辑：严格按队列顺序结算，不允许跳过或同时处理多人。
 */
export function chooseTrackPointsDestination(
  state: GameState,
  playerId: string,
  destination: TrackPointDestination,
): GameState {
  const pending = state.turn.pendingDeliveryResolution;
  if (!pending || pending.queue.length === 0) {
    return appendLog(state, "warning", "当前没有待分配的线路分。");
  }

  const currentChoice = pending.queue[0]!;
  if (currentChoice.playerId !== playerId) {
    return appendLog(state, "warning", "当前还没轮到该玩家决定线路分去向。");
  }

  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    return appendLog(state, "warning", "找不到要分配线路分的玩家。");
  }

  const updatedPlayer = applyTrackPointChoice(player, currentChoice.points, destination);
  const updatedState = replacePlayer(state, playerId, updatedPlayer);
  const nextQueue = pending.queue.slice(1);
  const moveOrder = state.turn.moveOrder?.length ? state.turn.moveOrder : state.turn.turnOrder;

  const withChoiceRecorded: GameState = appendLog(
    {
      ...updatedState,
      turn: {
        ...updatedState.turn,
        pendingDeliveryResolution: {
          ...pending,
          queue: nextQueue,
          resolvedChoices: {
            ...pending.resolvedChoices,
            [playerId]: destination,
          },
        },
      },
    },
    "action",
    `${updatedPlayer.name} 选择将 ${currentChoice.points} 点线路分加到${destination === "income" ? "收入" : "胜利点"}。`,
  );

  if (nextQueue.length === 0) {
    return advanceMovePlayer(
      {
        ...withChoiceRecorded,
        turn: {
          ...withChoiceRecorded.turn,
          phase: pending.sourcePhase,
          pendingDeliveryResolution: null,
        },
      },
      nextMovePhase({
        ...withChoiceRecorded,
        turn: {
          ...withChoiceRecorded.turn,
          phase: pending.sourcePhase,
        },
      }),
    );
  }

  return {
    ...withChoiceRecorded,
    turn: {
      ...withChoiceRecorded.turn,
      phase: "resolve-delivery",
      currentPlayerIndex: moveOrder.indexOf(nextQueue[0]!.playerId),
      pendingDeliveryResolution: {
        ...withChoiceRecorded.turn.pendingDeliveryResolution!,
        queue: nextQueue,
      },
    },
  };
}

/**
 * 功能：在货运阶段免费升级一次机车。
 * 参数：`state` 是当前正式状态，`playerId` 是行动玩家。
 * 返回：进入下一位玩家或下一货运轮的正式状态。
 * 逻辑：运输阶段升级不收取现金，只检查本回合是否已经免费升级过。
 */
export function upgradeLocomotive(state: GameState, playerId: string): GameState {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    return appendLog(state, "warning", "找不到升级机车的玩家。");
  }
  if (player.locomotiveLevel >= 6) {
    return appendLog(state, "warning", "机车等级已经达到 6 级上限。");
  }
  if (state.turn.upgradedThisTurn[playerId]) {
    return appendLog(state, "warning", "本回合运输阶段已经免费升级过一次机车。");
  }

  const nextState = replacePlayer(state, playerId, {
    ...player,
    locomotiveLevel: player.locomotiveLevel + 1,
  });

  return {
    ...appendLog(
      advanceMovePlayer(nextState, nextMovePhase(state)),
      "action",
      `${player.name} 免费将机车升级到 ${player.locomotiveLevel + 1} 级。`,
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
