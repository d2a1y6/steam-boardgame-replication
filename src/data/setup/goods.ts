/**
 * 功能概述：定义货物颜色、货物袋构成和 Goods Supply 初始常量。
 * 输入输出：不接收运行时输入；导出货物相关静态数据供初始状态与补货逻辑使用。
 * 处理流程：根据官方规则书整理颜色枚举、袋内数量与补货数量。
 */

export type GoodsColor = "red" | "blue" | "yellow" | "purple" | "gray";

export const GOODS_BAG_COMPOSITION: Record<GoodsColor, number> = {
  red: 20,
  blue: 20,
  yellow: 20,
  purple: 20,
  gray: 16,
};

export const GOODS_SUPPLY_SPACE_COUNT = 6;
export const GOODS_SUPPLY_CUBES_PER_SPACE = 3;
