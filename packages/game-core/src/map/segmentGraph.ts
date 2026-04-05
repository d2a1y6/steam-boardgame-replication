/**
 * 功能概述：把已铺轨道转换成可定位的轨道段集合。
 * 输入输出：输入轨道板、tile manifest 与旋转信息；输出 segment 列表。
 * 处理流程：根据板块出口对和旋转结果生成稳定的 segment id 与端点。
 */

import type { TileManifestEntry } from "../contracts/domain";
import type { TrackPieceState, TrackSegmentState } from "../state/gameState";

function rotateEdge(edge: number | "town", rotation: number) {
  if (edge === "town") {
    return edge;
  }
  return (edge + rotation + 6) % 6;
}

export function buildSegments(trackPieces: TrackPieceState[], tileManifest: readonly TileManifestEntry[]): TrackSegmentState[] {
  return trackPieces.flatMap((track) => {
    const manifest = tileManifest.find((tile) => tile.id === track.tileId);
    if (!manifest) {
      return [];
    }

    return manifest.exits.map(([edgeA, edgeB], index) => ({
      id: `${track.id}:segment-${index + 1}`,
      trackId: track.id,
      ownerId: track.segmentOwners?.[index] ?? track.ownerId,
      endpoints: [
        { hexId: track.hexId, edge: rotateEdge(edgeA, track.rotation) },
        { hexId: track.hexId, edge: rotateEdge(edgeB, track.rotation) },
      ],
    }));
  });
}
