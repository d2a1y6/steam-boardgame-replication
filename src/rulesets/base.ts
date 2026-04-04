/**
 * 功能概述：定义 Steam 基础版的固定规则常量与阶段顺序。
 * 输入输出：不接收运行时输入；导出基础版规则集对象供引擎读取。
 * 处理流程：整理回合数、行动费用、阶段顺序与融资能力等常量。
 */

export type GameMode = "base" | "standard";

export interface ActionCostTable {
  cityGrowth: number;
  locomotiveBase: number;
  urbanization: number;
}

export interface RuleSet {
  mode: GameMode;
  phaseOrder: string[];
  turnsByPlayerCount: Record<number, number>;
  canRaiseMoneyDuringTurn: boolean;
  actionCosts: ActionCostTable;
}

export const baseRuleSet: RuleSet = {
  mode: "base",
  phaseOrder: [
    "select-action",
    "build-track",
    "move-goods-round-1",
    "move-goods-round-2",
    "income",
    "determine-order",
    "set-up-next-turn",
  ],
  turnsByPlayerCount: {
    3: 10,
    4: 8,
    5: 7,
    6: 7,
  },
  canRaiseMoneyDuringTurn: true,
  actionCosts: {
    cityGrowth: 2,
    locomotiveBase: 4,
    urbanization: 6,
  },
};
