/**
 * 功能概述：提供轨道板形状的展示辅助数据。
 * 输入输出：不接收运行时输入；导出按六边方向索引组织的形状定义。
 * 处理流程：为基础版首批板块提供简单的出口数据复用。
 */

import { TILE_MANIFEST } from "@steam/game-content";

export const TILE_SHAPES = Object.fromEntries(
  TILE_MANIFEST.map((tile) => [tile.id, tile.exits]),
);
