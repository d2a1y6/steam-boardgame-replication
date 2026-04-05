/**
 * 功能概述：整理货运阶段的人类交互查询。
 * 输入输出：输入引擎会话与行动玩家；输出可运输货物源与排序后的候选方案。
 * 处理流程：先从规则层拿到所有候选，再按源点聚合或按优先级排序。
 */

import { rankDeliveryCandidates } from "../rules/routeRanking";
import { getDeliveryCandidates } from "../rules/goodsDelivery";
import type { EngineSession } from "../contracts/engine";

export interface GoodsSourceOptionView {
  readonly id: string;
  readonly sourceHexId: string;
  readonly goodsColor: string;
  readonly label: string;
  readonly candidateCount: number;
}

/**
 * 功能：列出当前玩家可运输的货物源。
 * 参数：`session` 是引擎会话，`playerId` 是行动玩家。
 * 返回：按“城市 + 颜色”聚合的货物源列表。
 * 逻辑：先搜索候选运输方案，再只保留至少有一条合法候选的源。
 */
export function getMovableGoodsSources(session: EngineSession, playerId: string): GoodsSourceOptionView[] {
  const grouped = new Map<string, GoodsSourceOptionView>();

  for (const candidate of getDeliveryCandidates(session.draft?.working ?? session.committed, playerId)) {
    const key = `${candidate.sourceHexId}:${candidate.goodsColor}`;
    const current = grouped.get(key);
    grouped.set(key, {
      id: key,
      sourceHexId: candidate.sourceHexId,
      goodsColor: candidate.goodsColor,
      label: `${candidate.sourceHexId} / ${candidate.goodsColor}`,
      candidateCount: (current?.candidateCount ?? 0) + 1,
    });
  }

  return [...grouped.values()].sort((left, right) => left.label.localeCompare(right.label));
}

/**
 * 功能：筛出某个货物源对应的候选运输方案。
 * 参数：`session` 是引擎会话，`playerId` 是行动玩家，`sourceHexId` 和 `goodsColor` 标识货物源。
 * 返回：排序后的少量候选方案。
 * 逻辑：先过滤同源同色候选，再复用排序函数裁剪数量。
 */
export function getRankedDeliveryCandidatesForSource(
  session: EngineSession,
  playerId: string,
  sourceHexId: string,
  goodsColor: string,
  limit = 3,
) {
  return rankDeliveryCandidates(
    getDeliveryCandidates(session.draft?.working ?? session.committed, playerId).filter(
      (candidate) => candidate.sourceHexId === sourceHexId && candidate.goodsColor === goodsColor,
    ),
    limit,
  );
}
