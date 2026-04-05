/**
 * 功能概述：判断建轨是否合法，并计算第一阶段需要的建轨费用。
 * 输入输出：输入玩家、地图、库存与目标位置；输出合法性、费用和是否启动新 link。
 * 处理流程：检查地块类型、黑边、库存以及与城市/己方轨道的连接关系。
 */

import type { MapHexDefinition, TileManifestEntry } from "../contracts/domain";
import type { MapRuntimeState, PlayerState, TrackPieceState } from "../state/gameState";
import { createMapGraph, getNeighborHex } from "../map/mapGraph";
import { hasTileAvailable } from "./tilePool";

export interface PlacementCheckResult {
  ok: boolean;
  reason?: string;
  cost?: number;
  startsNewLink?: boolean;
}

function rotateEdge(edge: number, rotation: number) {
  return (edge + rotation + 6) % 6;
}

function computeRotatedExits(tileManifest: readonly TileManifestEntry[], tileId: string, rotation: number) {
  const manifest = tileManifest.find((tile) => tile.id === tileId);
  if (!manifest) {
    return [];
  }
  return manifest.exits.flat().map((edge) => rotateEdge(edge, rotation));
}

function isCityOrTown(hex: MapHexDefinition | null) {
  return Boolean(hex && (hex.terrain === "city" || hex.isTown));
}

function touchesOwnTrack(trackPieces: TrackPieceState[], hexId: string, exits: number[], graph: ReturnType<typeof createMapGraph>) {
  const ownHexIds = new Set(trackPieces.map((track) => track.hexId));
  const currentHex = graph.byId[hexId];
  return exits.some((edge) => {
    const neighbor = getNeighborHex(graph, currentHex, edge);
    return neighbor && ownHexIds.has(neighbor.id);
  });
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

  const rotatedExits = computeRotatedExits(options.tileManifest, options.tileId, options.rotation);
  if ((hex.blockedEdges ?? []).some((edge) => rotatedExits.includes(edge))) {
    return { ok: false, reason: "轨道不能穿过粗黑边。" };
  }

  if (options.map.trackPieces.some((track) => track.hexId === options.hexId)) {
    return { ok: false, reason: "第一阶段暂不允许在同一格重复铺设轨道板。" };
  }

  const graph = createMapGraph(options.map.definition);
  const touchesCityOrTown = rotatedExits.some((edge) => isCityOrTown(getNeighborHex(graph, hex, edge)));
  const ownTracks = options.map.trackPieces.filter((track) => track.ownerId === options.player.id);
  const touchesOwn = touchesOwnTrack(ownTracks, hex.id, rotatedExits, graph);

  if (ownTracks.length === 0 && !touchesCityOrTown) {
    return { ok: false, reason: "你的第一块轨道必须从城市或城镇附近起步。" };
  }
  if (ownTracks.length > 0 && !touchesCityOrTown && !touchesOwn) {
    return { ok: false, reason: "新轨必须连接到城市/城镇或你自己的既有轨道。" };
  }

  const cost =
    manifest.baseCost +
    (hex.isTown ? 1 : 0) +
    (hex.hasRiver ? 1 : 0) +
    (hex.terrain === "hills" ? 2 : 0);

  return {
    ok: true,
    cost,
    startsNewLink: !touchesOwn,
  };
}
