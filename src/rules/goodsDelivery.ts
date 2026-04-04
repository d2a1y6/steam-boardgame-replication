/**
 * 功能概述：搜索并筛选合法货运方案，计算每位玩家的线路分。
 * 输入输出：输入当前局面与玩家；输出候选交付方案列表。
 * 处理流程：从有货城市出发搜路，再按借道比例与首个同色城市规则过滤。
 */

import type { DeliveryCandidate, GameState, LinkState } from "../state/gameState";
import { searchRoutes } from "../map/routeSearch";

function buildLinkMap(links: LinkState[]) {
  return Object.fromEntries(links.map((link) => [link.id, link]));
}

function countPointsByOwner(linkIds: string[], links: LinkState[]) {
  const byOwner: Record<string, number> = {};
  const linkMap = buildLinkMap(links);
  for (const linkId of linkIds) {
    const ownerId = linkMap[linkId]?.ownerId;
    if (!ownerId) {
      continue;
    }
    byOwner[ownerId] = (byOwner[ownerId] ?? 0) + 1;
  }
  return byOwner;
}

function isOwnershipConstraintSatisfied(playerId: string, pointsByOwner: Record<string, number>) {
  const selfPoints = pointsByOwner[playerId] ?? 0;
  if (selfPoints === 0) {
    return false;
  }
  return Object.entries(pointsByOwner)
    .filter(([ownerId]) => ownerId !== playerId)
    .every(([, points]) => selfPoints >= points);
}

export function getDeliveryCandidates(game: GameState, playerId: string): DeliveryCandidate[] {
  const player = game.players.find((item) => item.id === playerId);
  if (!player) {
    return [];
  }

  const candidates: DeliveryCandidate[] = [];
  for (const [sourceHexId, cubes] of Object.entries(game.map.cityGoods)) {
    for (const goodsColor of cubes) {
      const routes = searchRoutes({
        sourceHexId,
        goodsColor,
        locomotiveLevel: player.locomotiveLevel,
        links: game.map.links,
        mapHexes: game.map.definition.hexes,
      });

      for (const route of routes) {
        const pointsByOwner = countPointsByOwner(route.linkIds, game.map.links);
        if (!isOwnershipConstraintSatisfied(playerId, pointsByOwner)) {
          continue;
        }
        candidates.push({
          id: `delivery-${candidates.length + 1}`,
          playerId,
          sourceHexId,
          destinationHexId: route.pathStopIds[route.pathStopIds.length - 1],
          goodsColor,
          pathStopIds: route.pathStopIds,
          linkIds: route.linkIds,
          pointsByOwner,
          selfPoints: pointsByOwner[playerId] ?? 0,
        });
      }
    }
  }

  return candidates;
}
