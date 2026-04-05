/**
 * 功能概述：管理玩家标记与轨道段的锚点绑定关系。
 * 输入输出：输入 anchors、segment 和玩家；输出更新后的 anchors。
 * 处理流程：在新 link 启动时创建锚点，在轨道变化后过滤失效锚点。
 */

import type { TokenAnchorState, TrackSegmentState } from "../state/gameState";

export function addAnchor(
  anchors: TokenAnchorState[],
  playerId: string,
  segmentId: string,
): TokenAnchorState[] {
  return [...anchors, { playerId, segmentId }];
}

export function normalizeAnchors(
  anchors: TokenAnchorState[],
  segments: TrackSegmentState[],
): TokenAnchorState[] {
  const alive = new Set(segments.map((segment) => segment.id));
  return anchors.filter((anchor) => alive.has(anchor.segmentId));
}
