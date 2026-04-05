/**
 * 功能概述：判断建轨、重定向和升级既有轨道是否合法，并计算本次支付费用。
 * 输入输出：输入玩家、地图、库存与目标落位；输出是否合法、费用、操作类型和替换计划。
 * 处理流程：先解析目标 hex 上是否已有轨道，再分别按空格铺轨、重定向和 improve existing track 三套规则校验。
 */

import type { MapHexDefinition, TileManifestEntry } from "../contracts/domain";
import type { LinkState, MapRuntimeState, PlayerState, TrackPieceState } from "../state/gameState";
import { createMapGraph, getNeighborHex } from "../map/mapGraph";
import { hasTileAvailable } from "./tilePool";

export type TrackOperation = "place" | "redirect" | "improve";

export interface PlacementCheckResult {
  ok: boolean;
  reason?: string;
  cost?: number;
  startsNewLink?: boolean;
  operation?: TrackOperation;
  replacedTrackId?: string;
  nextSegmentOwners?: string[];
}

type RotatedPair = [number | "town", number | "town"];

function rotateEdge(edge: number | "town", rotation: number) {
  if (edge === "town") {
    return edge;
  }
  return (edge + rotation + 6) % 6;
}

function canonicalEndpoint(edge: number | "town") {
  return edge === "town" ? "town" : String(edge);
}

function canonicalPair([edgeA, edgeB]: RotatedPair) {
  const [left, right] = [canonicalEndpoint(edgeA), canonicalEndpoint(edgeB)].sort();
  return `${left}-${right}`;
}

function computeRotatedPairs(tileManifest: readonly TileManifestEntry[], tileId: string, rotation: number): RotatedPair[] {
  const manifest = tileManifest.find((tile) => tile.id === tileId);
  if (!manifest) {
    return [];
  }
  return manifest.exits.map(([edgeA, edgeB]) => [rotateEdge(edgeA, rotation), rotateEdge(edgeB, rotation)]);
}

function numericExits(pairs: readonly RotatedPair[]) {
  return [...new Set(
    pairs.flatMap((pair) => pair.filter((edge): edge is number => edge !== "town")),
  )];
}

function isStopHex(hex: MapHexDefinition | null) {
  return Boolean(hex && (hex.terrain === "city" || hex.isTown));
}

function isCity(hex: MapHexDefinition | null) {
  return Boolean(hex && hex.terrain === "city");
}

function touchesOwnTrack(
  trackPieces: readonly TrackPieceState[],
  hexId: string,
  exits: readonly number[],
  graph: ReturnType<typeof createMapGraph>,
) {
  const ownHexIds = new Set(trackPieces.map((track) => track.hexId));
  const currentHex = graph.byId[hexId];
  return exits.some((edge) => {
    const neighbor = getNeighborHex(graph, currentHex, edge);
    return neighbor && ownHexIds.has(neighbor.id);
  });
}

function parseTrackNumber(trackId: string) {
  const match = trackId.match(/track-(\d+)/);
  return match ? Number(match[1]) : -1;
}

function findLinkForTrack(map: MapRuntimeState, trackId: string) {
  return map.links.find((link) => link.segmentIds.some((segmentId) => segmentId.startsWith(`${trackId}:`))) ?? null;
}

function getTrackIdsInLink(link: LinkState) {
  return [...new Set(link.segmentIds.map((segmentId) => segmentId.split(":")[0] ?? ""))].filter(Boolean);
}

function isLastTrackOfLink(track: TrackPieceState, link: LinkState) {
  const trackIds = getTrackIdsInLink(link);
  const lastTrackId = trackIds.sort((left, right) => parseTrackNumber(right) - parseTrackNumber(left))[0] ?? null;
  return lastTrackId === track.id;
}

function linkStartsAtCity(map: MapRuntimeState, link: LinkState) {
  return link.touchedStops.some((stopId) => map.definition.hexes.find((hex) => hex.id === stopId)?.terrain === "city");
}

function buildPreservedOwners(
  oldTrack: TrackPieceState,
  oldPairs: readonly RotatedPair[],
  newPairs: readonly RotatedPair[],
  playerId: string,
) {
  const nextOwners = Array<string>(newPairs.length).fill(playerId);
  const usedNewIndices = new Set<number>();

  for (const [oldIndex, oldPair] of oldPairs.entries()) {
    const key = canonicalPair(oldPair);
    const matchIndex = newPairs.findIndex(
      (pair, newIndex) => !usedNewIndices.has(newIndex) && canonicalPair(pair) === key,
    );
    if (matchIndex < 0) {
      return null;
    }
    usedNewIndices.add(matchIndex);
    nextOwners[matchIndex] = oldTrack.segmentOwners?.[oldIndex] ?? oldTrack.ownerId;
  }

  return nextOwners;
}

function validateUsualBuildRules(
  map: MapRuntimeState,
  player: PlayerState,
  exits: readonly number[],
  hexId: string,
) {
  const graph = createMapGraph(map.definition);
  const touchesCity = exits.some((edge) => isCity(getNeighborHex(graph, graph.byId[hexId], edge)));
  const ownTracks = map.trackPieces.filter((track) => track.ownerId === player.id);
  const touchesOwn = touchesOwnTrack(ownTracks, hexId, exits, graph);

  if (ownTracks.length === 0 && !touchesCity) {
    return { ok: false, reason: "你的第一块轨道必须从城市附近起步。", startsNewLink: false };
  }
  if (ownTracks.length > 0 && !touchesOwn && !touchesCity) {
    return {
      ok: false,
      reason: "开始一条新 link 时，轨道必须从城市出发；否则就必须延伸你自己的既有轨道。",
      startsNewLink: false,
    };
  }

  return { ok: true, startsNewLink: !touchesOwn };
}

export function canPlaceTrack(options: {
  map: MapRuntimeState;
  tileManifest: readonly TileManifestEntry[];
  player: PlayerState;
  tilePool: { counts: Record<string, number> };
  hexId: string;
  tileId: string;
  rotation: number;
}): PlacementCheckResult {
  if (!hasTileAvailable(options.tilePool, options.tileId)) {
    return { ok: false, reason: "该轨道板库存已耗尽。" };
  }

  const hex = options.map.definition.hexes.find((item) => item.id === options.hexId);
  if (!hex) {
    return { ok: false, reason: "目标六边形不存在。" };
  }
  if (hex.terrain === "city") {
    return { ok: false, reason: "不能直接把轨道板放在城市格上。" };
  }

  const manifest = options.tileManifest.find((tile) => tile.id === options.tileId);
  if (!manifest) {
    return { ok: false, reason: "未知的轨道板。" };
  }
  if (hex.isTown && !manifest.isTownTile) {
    return { ok: false, reason: "城镇格只能放城镇轨道板。" };
  }

  const newPairs = computeRotatedPairs(options.tileManifest, options.tileId, options.rotation);
  const newNumericExits = numericExits(newPairs);
  if ((hex.blockedEdges ?? []).some((edge) => newNumericExits.includes(edge))) {
    return { ok: false, reason: "轨道不能穿过粗黑边。" };
  }

  const graph = createMapGraph(options.map.definition);
  if (newNumericExits.some((edge) => !getNeighborHex(graph, graph.byId[hex.id], edge))) {
    return { ok: false, reason: "轨道不能通向地图外侧。" };
  }

  const existingTrack = options.map.trackPieces.find((track) => track.hexId === options.hexId) ?? null;
  const ruleCheck = validateUsualBuildRules(options.map, options.player, newNumericExits, hex.id);

  if (!existingTrack) {
    if (!ruleCheck.ok) {
      return { ok: false, reason: ruleCheck.reason };
    }
    return {
      ok: true,
      cost: manifest.baseCost + (hex.hasRiver ? 1 : 0) + (hex.terrain === "hills" ? 2 : 0),
      startsNewLink: ruleCheck.startsNewLink,
      operation: "place",
    };
  }

  const existingLink = findLinkForTrack(options.map, existingTrack.id);
  const oldPairs = computeRotatedPairs(options.tileManifest, existingTrack.tileId, existingTrack.rotation);
  const preservedOwners = buildPreservedOwners(existingTrack, oldPairs, newPairs, options.player.id);
  const isImprovement =
    preservedOwners != null
    && newPairs.length >= oldPairs.length
    && (existingTrack.tileId !== options.tileId || existingTrack.rotation !== options.rotation)
    && newPairs.length > oldPairs.length;

  if (isImprovement) {
    return {
      ok: true,
      cost: manifest.baseCost,
      startsNewLink: ruleCheck.ok ? ruleCheck.startsNewLink : false,
      operation: "improve",
      replacedTrackId: existingTrack.id,
      nextSegmentOwners: preservedOwners,
    };
  }

  if (hex.isTown) {
    return { ok: false, reason: "town 轨道不能重定向，只能升级成拥有更多轨道的 town tile。" };
  }
  if (!existingLink || existingLink.complete) {
    return { ok: false, reason: "已完成的 link 不能被改变或重定向。" };
  }
  if (!isLastTrackOfLink(existingTrack, existingLink)) {
    return { ok: false, reason: "只能重定向 incomplete link 中最后放下的那块轨道。" };
  }
  if (existingLink.ownerId && existingLink.ownerId !== options.player.id) {
    return { ok: false, reason: "不能重定向其他玩家拥有的 incomplete link。" };
  }

  const ownTracks = options.map.trackPieces.filter((track) => track.ownerId === options.player.id);
  const canClaimUnowned = existingLink.ownerId == null
    ? linkStartsAtCity(options.map, existingLink) || touchesOwnTrack(ownTracks, hex.id, numericExits(oldPairs), graph)
    : true;
  if (!canClaimUnowned) {
    return { ok: false, reason: "只能重定向从城市出发、或直接连接到你自己 link 的无主 incomplete link。" };
  }
  if (!ruleCheck.ok && existingLink.ownerId == null) {
    return { ok: false, reason: ruleCheck.reason };
  }

  return {
    ok: true,
    cost: manifest.baseCost,
    startsNewLink: false,
    operation: "redirect",
    replacedTrackId: existingTrack.id,
    nextSegmentOwners: Array(newPairs.length).fill(existingTrack.ownerId),
  };
}
