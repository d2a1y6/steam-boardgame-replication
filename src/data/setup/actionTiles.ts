/**
 * 功能概述：定义基础版行动牌的编号、名称、顺位值与即时费用。
 * 输入输出：不接收运行时输入；导出行动牌列表供创建游戏和界面展示。
 * 处理流程：按官方规则书整理七张行动牌的静态元数据。
 */

export type ActionTileId =
  | "turn-order"
  | "first-move"
  | "engineer"
  | "first-build"
  | "city-growth"
  | "locomotive"
  | "urbanization";

export interface ActionTileDefinition {
  id: ActionTileId;
  value: number;
  label: string;
  hasPassOption: boolean;
}

export const ACTION_TILE_DEFINITIONS: ActionTileDefinition[] = [
  { id: "turn-order", value: 1, label: "Turn Order", hasPassOption: false },
  { id: "first-move", value: 2, label: "First Move", hasPassOption: false },
  { id: "engineer", value: 3, label: "Engineer", hasPassOption: false },
  { id: "first-build", value: 4, label: "First Build", hasPassOption: false },
  { id: "city-growth", value: 5, label: "City Growth", hasPassOption: true },
  { id: "locomotive", value: 6, label: "Locomotive", hasPassOption: false },
  { id: "urbanization", value: 7, label: "Urbanization", hasPassOption: true },
];
