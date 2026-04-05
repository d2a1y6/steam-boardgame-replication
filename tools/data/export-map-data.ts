/**
 * 功能概述：输出当前已录入地图的摘要，便于后续批量录入与核对。
 * 输入输出：读取本地地图定义；打印地图名与 hex 数量。
 * 处理流程：遍历已登记地图并输出关键统计。
 */

import { neUsaSeCanadaMap, ruhrMap } from "@steam/game-content";

for (const map of [neUsaSeCanadaMap, ruhrMap]) {
  console.log(`${map.id}: ${map.hexes.length} hexes`);
}
