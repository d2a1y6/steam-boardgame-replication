/**
 * 功能概述：提供东北美洲地图的第一阶段最小数据集。
 * 输入输出：不接收运行时输入；导出供引擎初始化和测试使用的地图对象。
 * 处理流程：先覆盖城市、城镇、黑边与少量演示 hex，后续再逐步补完整图。
 */

import type { GoodsColor } from "../setup/goods";

export type TerrainType = "plains" | "hills" | "city";

export interface MapHexDefinition {
  id: string;
  q: number;
  r: number;
  terrain: TerrainType;
  hasRiver?: boolean;
  blockedEdges?: number[];
  cityColor?: GoodsColor;
  cityDemand?: number;
  isTown?: boolean;
  label?: string;
}

export interface MapDefinition {
  id: string;
  name: string;
  hexes: MapHexDefinition[];
}

export const neUsaSeCanadaMap: MapDefinition = {
  id: "ne-usa-se-canada",
  name: "NE USA & SE Canada",
  hexes: [
    { id: "albany", q: 0, r: 0, terrain: "city", cityColor: "red", cityDemand: 2, label: "Albany" },
    { id: "poughkeepsie", q: 1, r: 0, terrain: "plains", hasRiver: true, isTown: true, label: "Poughkeepsie" },
    { id: "new-york", q: 2, r: 0, terrain: "city", cityColor: "blue", cityDemand: 3, label: "New York" },
    { id: "hartford", q: 1, r: -1, terrain: "hills", label: "Hartford" },
    { id: "new-haven", q: 2, r: -1, terrain: "plains", isTown: true, label: "New Haven" },
    { id: "boston", q: 3, r: -1, terrain: "city", cityColor: "yellow", cityDemand: 2, label: "Boston" },
    { id: "coast", q: 3, r: 0, terrain: "plains", blockedEdges: [0, 1], label: "Atlantic" },
  ],
};
