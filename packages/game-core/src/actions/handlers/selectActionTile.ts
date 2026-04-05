/**
 * 功能概述：处理行动牌选择动作。
 * 输入输出：输入当前正式状态、玩家和目标行动牌；输出更新后的正式状态。
 * 处理流程：校验占用情况，写入已选行动牌，并在所有玩家都选完后切换到建轨阶段。
 */

import type { ActionTileId } from "../../contracts/domain";
import type { GameState } from "../../state/gameState";
import { enterPhase } from "../phaseMachine";
import { appendLog } from "./shared";

/**
 * 功能：写入一名玩家本回合选择的行动牌。
 * 参数：`state` 是当前正式状态，`playerId` 是行动玩家，`tileId` 是目标行动牌。
 * 返回：新的正式状态。
 * 逻辑：如果已被占用则只追加警告日志，否则记录选择并视情况推进阶段。
 */
export function setSelectedActionTile(state: GameState, playerId: string, tileId: ActionTileId): GameState {
  if (Object.values(state.turn.selectedActionTiles).includes(tileId)) {
    return appendLog(state, "warning", `行动牌 ${tileId} 已被选择。`);
  }

  const nextState = {
    ...state,
    turn: {
      ...state.turn,
      selectedActionTiles: {
        ...state.turn.selectedActionTiles,
        [playerId]: tileId,
      },
    },
  };

  const allSelected = nextState.players.every((player) => nextState.turn.selectedActionTiles[player.id] != null);
  if (allSelected) {
    return enterPhase(
      appendLog(nextState, "action", `${playerId} 选择了行动牌 ${tileId}。`),
      "build-track",
    );
  }

  return {
    ...appendLog(nextState, "action", `${playerId} 选择了行动牌 ${tileId}。`),
    turn: {
      ...nextState.turn,
      currentPlayerIndex: Math.min(nextState.turn.currentPlayerIndex + 1, nextState.players.length - 1),
    },
  };
}
