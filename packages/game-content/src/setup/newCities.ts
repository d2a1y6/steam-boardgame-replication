/**
 * 功能概述：定义新城市板块的颜色与库存。
 * 输入输出：不接收运行时输入；导出新城市板块列表供城市化逻辑使用。
 * 处理流程：按官方组件清单整理八块新城市板。
 */

import type { GoodsColor } from "@steam/game-core";

export const NEW_CITY_TILE_COLORS: GoodsColor[] = [
  "red",
  "yellow",
  "purple",
  "blue",
  "gray",
  "gray",
  "gray",
  "gray",
];
