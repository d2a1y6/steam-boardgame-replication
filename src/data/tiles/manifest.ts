/**
 * 功能概述：定义轨道板的形状编号、库存数量与基础非地形成本。
 * 输入输出：不接收运行时输入；导出最小 tile manifest 供基础库存检查使用。
 * 处理流程：先覆盖第一阶段会用到的常见板块，并给后续补全官方清单留接口。
 */

export interface TileManifestEntry {
  id: string;
  exits: number[][];
  count: number;
  isTownTile: boolean;
  baseCost: number;
}

export const TILE_MANIFEST: TileManifestEntry[] = [
  { id: "21", exits: [[0, 3]], count: 86, isTownTile: false, baseCost: 2 },
  { id: "22", exits: [[0, 1]], count: 86, isTownTile: false, baseCost: 2 },
  { id: "t11", exits: [[0, 3]], count: 4, isTownTile: true, baseCost: 3 },
  { id: "t21", exits: [[0, 3], [1, 4]], count: 10, isTownTile: true, baseCost: 5 },
  { id: "42", exits: [[0, 3], [1, 4]], count: 4, isTownTile: false, baseCost: 4 },
];
