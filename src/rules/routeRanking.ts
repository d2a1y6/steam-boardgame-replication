/**
 * 功能概述：把合法运输方案排序成更适合界面展示的候选列表。
 * 输入输出：输入候选交付方案；输出按价值排序的前若干项。
 * 处理流程：优先按自己得分、路径长度和终点名称进行稳定排序。
 */

import type { DeliveryCandidate } from "../state/gameState";

export function rankDeliveryCandidates(candidates: DeliveryCandidate[], limit = 3) {
  return [...candidates]
    .sort((left, right) => {
      if (right.selfPoints !== left.selfPoints) {
        return right.selfPoints - left.selfPoints;
      }
      if (left.linkIds.length !== right.linkIds.length) {
        return left.linkIds.length - right.linkIds.length;
      }
      return left.destinationHexId.localeCompare(right.destinationHexId);
    })
    .slice(0, limit);
}
