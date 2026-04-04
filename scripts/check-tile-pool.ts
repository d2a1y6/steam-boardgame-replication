/**
 * 功能概述：检查当前录入的轨道板库存是否满足最小一致性要求。
 * 输入输出：读取本地 tile manifest；输出校验摘要并以退出码表示是否通过。
 * 处理流程：累加库存、检查重复 id、输出总数与基础告警。
 */

import { TILE_MANIFEST } from "../src/data/tiles/manifest";

const ids = new Set<string>();
let totalCount = 0;

for (const tile of TILE_MANIFEST) {
  if (ids.has(tile.id)) {
    console.error(`重复的轨道板 ID: ${tile.id}`);
    throw new Error(`重复的轨道板 ID: ${tile.id}`);
  }
  ids.add(tile.id);
  totalCount += tile.count;
}

console.log(`已记录轨道板类型: ${TILE_MANIFEST.length}`);
console.log(`已记录轨道板总数: ${totalCount}`);
