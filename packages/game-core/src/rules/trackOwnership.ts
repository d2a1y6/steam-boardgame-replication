/**
 * 功能概述：根据 segment 与锚点刷新 link 所有权和完成状态。
 * 输入输出：输入地图运行时状态；输出更新后的 map 片段。
 * 处理流程：重建 segments、过滤失效 anchors，再聚合 links。
 */

import { buildLinks } from "../map/linkGraph";
import { buildSegments } from "../map/segmentGraph";
import type { TileManifestEntry } from "../contracts/domain";
import type { MapRuntimeState } from "../state/gameState";
import { normalizeAnchors } from "./tokenAnchors";

export function rebuildTrackOwnership(map: MapRuntimeState, tileManifest: readonly TileManifestEntry[]): MapRuntimeState {
  const segments = buildSegments(map.trackPieces, tileManifest);
  const anchors = normalizeAnchors(map.anchors, segments);
  const links = buildLinks({
    segments,
    mapHexes: map.definition.hexes,
    anchors,
  });

  return {
    ...map,
    segments,
    anchors,
    links,
  };
}
