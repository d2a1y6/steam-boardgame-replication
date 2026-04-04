/**
 * 功能概述：把已铺轨道转换成可定位的轨道段集合。
 * 输入输出：输入轨道板、tile manifest 与旋转信息；输出 segment 列表。
 * 处理流程：根据板块出口对和旋转结果生成稳定的 segment id 与端点。
 */

import { TILE_MANIFEST } from "../data/tiles/manifest";
import type { TrackPieceState, TrackSegmentState } from "../state/gameState";

function rotateEdge(edge: number, rotation: number) {
  return (edge + rotation + 6) % 6;
}

export function buildSegments(trackPieces: TrackPieceState[]): TrackSegmentState[] {
  return trackPieces.flatMap((track) => {
    const manifest = TILE_MANIFEST.find((tile) => tile.id === track.tileId);
    if (!manifest) {
      return [];
    }

    return manifest.exits.map(([edgeA, edgeB], index) => ({
      id: `${track.id}:segment-${index + 1}`,
      trackId: track.id,
      ownerId: track.ownerId,
      endpoints: [
        { hexId: track.hexId, edge: rotateEdge(edgeA, track.rotation) },
        { hexId: track.hexId, edge: rotateEdge(edgeB, track.rotation) },
      ],
    }));
  });
}
