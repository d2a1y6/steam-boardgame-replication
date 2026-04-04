/**
 * 功能概述：预留鲁尔地图入口，便于后续补标准版和第二张基础地图。
 * 输入输出：不接收运行时输入；导出占位地图对象供规则和界面识别。
 * 处理流程：先给出最小元数据，后续再补完整六边格数据。
 */

import type { MapDefinition } from "./ne_usa_se_canada";

export const ruhrMap: MapDefinition = {
  id: "ruhr",
  name: "Ruhr",
  hexes: [],
};
