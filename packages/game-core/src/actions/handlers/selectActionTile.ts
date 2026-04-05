/**
 * 功能概述：处理选行动牌时的即时效果、费用、Pass Option 与阶段切换。
 * 输入输出：输入当前正式状态、玩家和目标行动牌；输出更新后的正式状态。
 * 处理流程：先写入牌面选择，再应用立即生效的费用/机车升级，最后在全员选完后进入建轨阶段。
 */

import type { ActionTileId } from "../../contracts/domain";
import type { GameState } from "../../state/gameState";
import { ensureCashForImmediateCost, locomotiveUpgradeCost } from "../../rules/finance";
import { enterPhase } from "../phaseMachine";
import { appendLog, replacePlayer } from "./shared";

function markSelectedAction(
  state: GameState,
  playerId: string,
  tileId: ActionTileId,
  usePassOption: boolean,
): GameState {
  return {
    ...state,
    turn: {
      ...state.turn,
      selectedActionTiles: {
        ...state.turn.selectedActionTiles,
        [playerId]: tileId,
      },
      passedActionTiles: {
        ...(state.turn.passedActionTiles ?? {}),
        [playerId]: usePassOption,
      },
      pendingBuildActions: {
        ...(state.turn.pendingBuildActions ?? {}),
        [playerId]:
          !usePassOption && (tileId === "city-growth" || tileId === "urbanization")
            ? tileId
            : null,
      },
    },
  };
}

/**
 * 功能：写入一名玩家本回合选择的行动牌。
 * 参数：`state` 是当前正式状态，`playerId` 是行动玩家，`tileId` 是目标行动牌，`usePassOption` 指示是否立刻翻面放弃。
 * 返回：新的正式状态。
 * 逻辑：基础版会在选牌时处理费用和机车立即升级；标准版则只记录选择，不在此时付款。
 */
export function setSelectedActionTile(
  state: GameState,
  playerId: string,
  tileId: ActionTileId,
  usePassOption = false,
): GameState {
  if (Object.values(state.turn.selectedActionTiles).includes(tileId)) {
    return appendLog(state, "warning", `行动牌 ${tileId} 已被选择。`);
  }

  const tileDefinition = state.content.actionTiles.find((tile) => tile.id === tileId);
  if (!tileDefinition) {
    return appendLog(state, "warning", `未知行动牌：${tileId}。`);
  }
  if (usePassOption && !tileDefinition.hasPassOption) {
    return appendLog(state, "warning", `${tileId} 不支持 Pass Option。`);
  }

  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    return appendLog(state, "warning", "找不到选择行动牌的玩家。");
  }

  let nextState = markSelectedAction(state, playerId, tileId, usePassOption);
  const allowRaise = state.ruleset.canRaiseMoneyDuringTurn;

  if (tileId === "city-growth" && !usePassOption && state.ruleset.actionCosts.cityGrowth > 0) {
    const paid = ensureCashForImmediateCost(player, state.ruleset.actionCosts.cityGrowth, allowRaise);
    if (!paid.ok) {
      return appendLog(state, "warning", paid.reason ?? "当前无法支付 City Growth 费用。");
    }
    nextState = replacePlayer(nextState, playerId, paid.player);
  }

  if (tileId === "urbanization" && !usePassOption && state.ruleset.actionCosts.urbanization > 0) {
    const paid = ensureCashForImmediateCost(player, state.ruleset.actionCosts.urbanization, allowRaise);
    if (!paid.ok) {
      return appendLog(state, "warning", paid.reason ?? "当前无法支付 Urbanization 费用。");
    }
    nextState = replacePlayer(nextState, playerId, paid.player);
  }

  if (tileId === "locomotive") {
    const cost = locomotiveUpgradeCost(player, state.ruleset.actionCosts.locomotiveBase);
    const paid = ensureCashForImmediateCost(player, cost, allowRaise);
    if (!paid.ok) {
      return appendLog(state, "warning", paid.reason ?? "当前无法支付机车升级费用。");
    }
    nextState = replacePlayer(nextState, playerId, {
      ...paid.player,
      locomotiveLevel: Math.min(6, paid.player.locomotiveLevel + 1),
    });
  }

  nextState = appendLog(
    nextState,
    "action",
    usePassOption
      ? `${player.name} 选择了行动牌 ${tileId} 并使用 Pass Option。`
      : `${player.name} 选择了行动牌 ${tileId}。`,
  );

  const allSelected = nextState.players.every((item) => nextState.turn.selectedActionTiles[item.id] != null);
  if (allSelected) {
    return enterPhase(nextState, "build-track");
  }

  return {
    ...nextState,
    turn: {
      ...nextState.turn,
      currentPlayerIndex: Math.min(nextState.turn.currentPlayerIndex + 1, nextState.players.length - 1),
    },
  };
}
