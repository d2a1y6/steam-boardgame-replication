/**
 * 功能概述：处理机车升级动作。
 * 输入输出：输入当前状态与行动玩家；输出扣费并升级机车后的新状态。
 * 处理流程：先融资支付升级费用，再提升机车等级并记录本回合已升级标记。
 */

import type { GameState } from "../../state/gameState";
import { appendLog, replacePlayer } from "../helpers";

export function handleUpgradeLocomotive(state: GameState, playerId: string): GameState {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    return appendLog(state, "warning", "找不到升级机车的玩家。");
  }
  if (player.locomotiveLevel >= 6) {
    return appendLog(state, "warning", "机车等级已经达到 6 级上限。");
  }
  const nextState = replacePlayer(state, playerId, {
    ...player,
    locomotiveLevel: player.locomotiveLevel + 1,
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
