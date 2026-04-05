/**
 * 功能概述：定义 Steam 标准版相对于基础版的阶段与费用差异。
 * 输入输出：不接收运行时输入；导出标准版规则集对象供后续扩展使用。
 * 处理流程：复用基础版常量结构，并覆盖标准版专有的阶段顺序与经济规则。
 */

import type { RuleSet } from "@steam/game-core";

export const standardRuleSet: RuleSet = {
  mode: "standard",
  phaseOrder: [
    "buy-capital",
    "auction-turn-order",
    "select-action",
    "build-track",
    "move-goods-round-1",
    "move-goods-round-2",
    "income",
    "set-up-next-turn",
  ],
  turnsByPlayerCount: {
    3: 10,
    4: 8,
    5: 7,
    6: 7,
  },
  canRaiseMoneyDuringTurn: false,
  actionCosts: {
    cityGrowth: 0,
    locomotiveBase: 0,
    urbanization: 0,
  },
};
