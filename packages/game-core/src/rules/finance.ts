/**
 * 功能概述：集中处理 Steam 的现金、融资、买资本、维护费与破产结算。
 * 输入输出：输入玩家经济状态、模式与当前支出；输出更新后的玩家状态与支付摘要。
 * 处理流程：基础版优先走“现金不足即可融资”，标准版优先走“现金支付，不足则改掉 VP / Income”。
 */

import type { GameMode } from "../contracts/domain";
import type { PlayerState } from "../state/gameState";

export interface FinanceResult {
  ok: boolean;
  player: PlayerState;
  raisedMoney: number;
  change: number;
  reason?: string;
}

/**
 * 功能：在允许融资的口径下支付一笔即时费用。
 * 参数：`player` 是当前玩家，`cost` 是目标费用，`allowRaise` 控制是否允许融资。
 * 返回：支付后的玩家状态与摘要；若标准版现金不足则返回 `ok: false`。
 * 逻辑：基础版先花现金，不够时每 5 元下降 1 收入；跌到 -10 后再改为每 5 元失去 2 VP。
 */
export function ensureCashForImmediateCost(
  player: PlayerState,
  cost: number,
  allowRaise = true,
): FinanceResult {
  if (cost <= player.cash) {
    return {
      ok: true,
      player: { ...player, cash: player.cash - cost },
      raisedMoney: 0,
      change: 0,
    };
  }

  if (!allowRaise) {
    return {
      ok: false,
      player,
      raisedMoney: 0,
      change: 0,
      reason: "当前模式下本阶段不能融资，现金不足以支付该费用。",
    };
  }

  const remaining = cost - player.cash;
  const steps = Math.ceil(remaining / 5);
  const raisedMoney = steps * 5;
  const incomeAfterRaise = player.income - steps;
  const change = raisedMoney - remaining;

  if (incomeAfterRaise >= -10) {
    return {
      ok: true,
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
    return {
      ok: false,
      player,
      raisedMoney: 0,
      change: 0,
      reason: "该玩家已无法继续融资。",
    };
  }

  return {
    ok: true,
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

/**
 * 功能：在标准版第 1 阶段买资本。
 * 参数：`player` 是当前玩家，`steps` 是要倒退几格收入轨，换取 `steps * 5` 现金。
 * 返回：买资本后的玩家状态。
 * 逻辑：标准版买资本复用基础版融资比例，但只能在专门阶段执行。
 */
export function buyCapital(player: PlayerState, steps: number): PlayerState {
  if (steps <= 0) {
    return player;
  }

  const incomeAfterRaise = player.income - steps;
  if (incomeAfterRaise < -10) {
    throw new Error("标准版买资本不能把收入轨降到 -10 以下。");
  }

  return {
    ...player,
    income: incomeAfterRaise,
    cash: player.cash + steps * 5,
  };
}

function resolveBaseIncome(player: PlayerState): PlayerState {
  if (player.income >= 0) {
    return {
      ...player,
      cash: player.cash + player.income,
    };
  }

  return ensureCashForImmediateCost(player, Math.abs(player.income), true).player;
}

function resolveStandardIncome(player: PlayerState): PlayerState {
  const net = player.income - player.locomotiveLevel;
  if (net >= 0) {
    return {
      ...player,
      cash: player.cash + net,
    };
  }

  const required = Math.abs(net);
  const cashPaid = Math.min(player.cash, required);
  let shortage = required - cashPaid;
  let nextPlayer: PlayerState = {
    ...player,
    cash: player.cash - cashPaid,
  };

  if (shortage <= 0) {
    return nextPlayer;
  }

  const vpDrop = Math.min(nextPlayer.victoryPoints, Math.ceil(shortage / 2));
  nextPlayer = {
    ...nextPlayer,
    victoryPoints: nextPlayer.victoryPoints - vpDrop,
  };
  shortage = Math.max(0, shortage - vpDrop * 2);

  if (shortage <= 0) {
    return nextPlayer;
  }

  const incomeDrop = Math.ceil(shortage / 2);
  if (nextPlayer.income - incomeDrop < -10) {
    return {
      ...nextPlayer,
      income: -10,
      bankrupt: true,
    };
  }

  return {
    ...nextPlayer,
    income: nextPlayer.income - incomeDrop,
  };
}

/**
 * 功能：按当前模式结算回合末收入与支出。
 * 参数：`player` 是当前玩家，`mode` 是当前游戏模式。
 * 返回：已经完成收入或维护费结算的玩家状态。
 * 逻辑：基础版走普通收入/融资规则，标准版改为“收入减维护费，不足则先掉 VP 再掉 Income”。
 */
export function resolveIncome(player: PlayerState, mode: GameMode): PlayerState {
  return mode === "standard" ? resolveStandardIncome(player) : resolveBaseIncome(player);
}

/**
 * 功能：计算行动牌带来的机车升级费用。
 * 参数：`player` 是当前玩家，`baseCost` 是规则集上的基础费用。
 * 返回：本次行动牌升级需要支付的现金。
 * 逻辑：基础版为 `$4 + 新等级`，标准版基础费用为 0，因此会自然退化为免费升级。
 */
export function locomotiveUpgradeCost(player: PlayerState, baseCost: number) {
  const nextLevel = player.locomotiveLevel + 1;
  return baseCost > 0 ? baseCost + nextLevel : 0;
}
