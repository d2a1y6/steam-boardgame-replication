/**
 * 功能概述：定义官方附录里的完整轨道板清单、库存数量与非地形成本。
 * 输入输出：不接收运行时输入；导出完整 tile manifest 供库存、建轨与升级规则使用。
 * 处理流程：按规则书第 16 页的 face pairing 逐条录入，并用 town 端点表达城镇轨道。
 */

import type { TileManifestEntry } from "@steam/game-core";

export const TILE_MANIFEST: readonly TileManifestEntry[] = [
  { id: "21", exits: [[0, 3]], count: 86, isTownTile: false, baseCost: 2 },
  { id: "22", exits: [[0, 1]], count: 86, isTownTile: false, baseCost: 2 },
  { id: "T21", exits: [["town", 0], ["town", 3]], count: 10, isTownTile: true, baseCost: 3 },
  { id: "T22", exits: [["town", 0], ["town", 1]], count: 10, isTownTile: true, baseCost: 3 },
  { id: "23", exits: [[0, 2]], count: 8, isTownTile: false, baseCost: 2 },
  { id: "T23", exits: [["town", 0], ["town", 2]], count: 8, isTownTile: true, baseCost: 3 },
  { id: "T11", exits: [["town", 0]], count: 4, isTownTile: true, baseCost: 2 },
  { id: "42", exits: [[0, 3], [1, 4]], count: 4, isTownTile: false, baseCost: 4 },
  { id: "T41", exits: [["town", 0], ["town", 1], ["town", 3], ["town", 4]], count: 4, isTownTile: true, baseCost: 5 },
  { id: "T31", exits: [["town", 0], ["town", 2], ["town", 4]], count: 4, isTownTile: true, baseCost: 4 },
  { id: "T34", exits: [["town", 0], ["town", 2], ["town", 3]], count: 4, isTownTile: true, baseCost: 4 },
  { id: "T42", exits: [["town", 0], ["town", 1], ["town", 2], ["town", 4]], count: 4, isTownTile: true, baseCost: 5 },
  { id: "41", exits: [[0, 3], [1, 2]], count: 4, isTownTile: false, baseCost: 4 },
  { id: "43", exits: [[0, 1], [3, 4]], count: 4, isTownTile: false, baseCost: 4 },
  { id: "T43", exits: [["town", 0], ["town", 1], ["town", 3], ["town", 5]], count: 4, isTownTile: true, baseCost: 5 },
  { id: "T32", exits: [["town", 0], ["town", 1], ["town", 4]], count: 4, isTownTile: true, baseCost: 4 },
  { id: "T33", exits: [["town", 0], ["town", 3], ["town", 4]], count: 4, isTownTile: true, baseCost: 4 },
  { id: "44", exits: [[0, 3], [1, 5]], count: 2, isTownTile: false, baseCost: 4 },
  { id: "45", exits: [[0, 1], [3, 5]], count: 2, isTownTile: false, baseCost: 4 },
  { id: "47", exits: [[0, 2], [3, 5]], count: 2, isTownTile: false, baseCost: 4 },
  { id: "46", exits: [[0, 2], [3, 4]], count: 2, isTownTile: false, baseCost: 4 },
] as const;
