/**
 * 功能概述：处理融资、找零、收入结算和机车升级费用。
 * 输入输出：输入玩家经济状态与当前支出；输出更新后的玩家状态与说明信息。
 * 处理流程：先花现金，再按 5 元单位融资，必要时继续消耗 VP。
 */

import type { PlayerState } from "../state/gameState";

export interface FinanceResult {
  player: PlayerState;
  raisedMoney: number;
  change: number;
}

export function ensureCashForImmediateCost(player: PlayerState, cost: number): FinanceResult {
  if (cost <= player.cash) {
    return {
      player: { ...player, cash: player.cash - cost },
      raisedMoney: 0,
      change: 0,
    };
  }

  const remaining = cost - player.cash;
  const steps = Math.ceil(remaining / 5);
  const raisedMoney = steps * 5;
  const incomeAfterRaise = player.income - steps;
  const change = raisedMoney - remaining;

  if (incomeAfterRaise >= -10) {
    return {
      player: {
        ...player,
        cash: change,
        income: incomeAfterRaise,
      },
      raisedMoney,
      change,
    };
  }

  const stepsAtIncome = Math.max(0, player.income + 10);
  const vpSteps = steps - stepsAtIncome;
  const newVictoryPoints = player.victoryPoints - vpSteps * 2;
  if (newVictoryPoints < 0) {
    throw new Error("Player cannot raise more money.");
  }

  return {
    player: {
      ...player,
      cash: change,
      income: -10,
      victoryPoints: newVictoryPoints,
    },
    raisedMoney,
    change,
  };
}

export function resolveIncome(player: PlayerState): PlayerState {
  if (player.income >= 0) {
    return {
      ...player,
      cash: player.cash + player.income,
    };
  }

  return ensureCashForImmediateCost(player, Math.abs(player.income)).player;
}

export function locomotiveUpgradeCost(player: PlayerState, paidByActionTile: boolean) {
  const nextLevel = player.locomotiveLevel + 1;
  return paidByActionTile ? 4 + nextLevel : 0;
}
