/**
 * 功能概述：提供第一阶段会用到的基础拍卖占位实现。
 * 输入输出：输入玩家顺位列表；输出初始顺位结果。
 * 处理流程：当前仅复用现有顺位，后续再替换为完整竞拍流程。
 */

export function getInitialAuctionOrder(playerIds: string[]) {
  return [...playerIds];
}
