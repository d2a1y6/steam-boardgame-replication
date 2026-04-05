/**
 * 功能概述：把地图定义转成便于规则查询的六边格图索引。
 * 输入输出：输入地图定义；输出按 id 与坐标组织的索引结果。
 * 处理流程：建立 id 索引、坐标索引与邻接查询函数。
 */

import type { MapDefinition, MapHexDefinition } from "../contracts/domain";
import { axialKey, neighborCoordinate } from "./hexMath";

export interface MapGraph {
  byId: Record<string, MapHexDefinition>;
  byCoord: Record<string, MapHexDefinition>;
}

export function createMapGraph(map: MapDefinition): MapGraph {
  return {
    byId: Object.fromEntries(map.hexes.map((hex) => [hex.id, hex])),
    byCoord: Object.fromEntries(map.hexes.map((hex) => [axialKey(hex.q, hex.r), hex])),
  };
}

export function getNeighborHex(graph: MapGraph, hex: MapHexDefinition, edge: number) {
  const coord = neighborCoordinate(hex.q, hex.r, edge);
  return graph.byCoord[axialKey(coord.q, coord.r)] ?? null;
}
