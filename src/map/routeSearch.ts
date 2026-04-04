/**
 * 功能概述：在完整 link 图上搜索一枚货物的合法运输路径。
 * 输入输出：输入当前玩家、起点城市、目标颜色、link 列表和机车等级；输出合法 stop 路径集合。
 * 处理流程：以 stop 为节点做深度优先搜索，并遵守首个同色城市即停止等限制。
 */

import type { MapHexDefinition } from "../data/maps/ne_usa_se_canada";
import type { LinkState } from "../state/gameState";

export interface RouteOption {
  pathStopIds: string[];
  linkIds: string[];
}

function buildAdjacency(links: LinkState[]) {
  const adjacency: Record<string, Array<{ nextStopId: string; linkId: string; ownerId: string | null }>> = {};

  for (const link of links.filter((item) => item.complete && item.touchedStops.length >= 2)) {
    const [stopA, stopB] = link.touchedStops;
    adjacency[stopA] ??= [];
    adjacency[stopB] ??= [];
    adjacency[stopA].push({ nextStopId: stopB, linkId: link.id, ownerId: link.ownerId });
    adjacency[stopB].push({ nextStopId: stopA, linkId: link.id, ownerId: link.ownerId });
  }

  return adjacency;
}

export function searchRoutes(options: {
  sourceHexId: string;
  goodsColor: string;
  locomotiveLevel: number;
  links: LinkState[];
  mapHexes: MapHexDefinition[];
}): RouteOption[] {
  const adjacency = buildAdjacency(options.links);
  const mapById = Object.fromEntries(options.mapHexes.map((hex) => [hex.id, hex]));
  const routes: RouteOption[] = [];

  function dfs(currentStopId: string, pathStopIds: string[], linkIds: string[]) {
    if (linkIds.length > options.locomotiveLevel) {
      return;
    }

    const currentHex = mapById[currentStopId];
    if (
      currentStopId !== options.sourceHexId &&
      currentHex?.terrain === "city" &&
      currentHex.cityColor === options.goodsColor
    ) {
      routes.push({ pathStopIds, linkIds });
      return;
    }

    for (const edge of adjacency[currentStopId] ?? []) {
      if (pathStopIds.includes(edge.nextStopId)) {
        continue;
      }
      dfs(edge.nextStopId, [...pathStopIds, edge.nextStopId], [...linkIds, edge.linkId]);
    }
  }

  dfs(options.sourceHexId, [options.sourceHexId], []);
  return routes;
}
