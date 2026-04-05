/**
 * 功能概述：为建轨和运货提供界面预览摘要。
 * 输入输出：输入当前会话、候选动作或方案；输出成本、分配与规则解释。
 * 处理流程：把规则函数的原始结果整理成 UI 更容易展示的短文本。
 */

import type { DeliveryCandidate } from "../state/gameState";
import type { EngineSession } from "./types";
import { getWorkingState } from "./draftSession";
import { canPlaceTrack } from "../rules/trackPlacement";

export interface TrackPlacementPreview {
  readonly ok: boolean;
  readonly costText: string;
  readonly financeText: string;
  readonly linkText: string;
  readonly reason?: string;
}

export interface DeliveryPreview {
  readonly title: string;
  readonly pathText: string;
  readonly payoutText: string;
  readonly explanation: string;
}

/**
 * 功能：预览一次建轨落位的成本和即时影响。
 * 参数：`session` 是当前会话，`playerId` 是行动玩家，其余参数描述预选落位。
 * 返回：可直接渲染到面板的建轨预览。
 * 逻辑：调用建轨校验，并把费用和融资结果折成短文本。
 */
export function getTrackPlacementPreview(
  session: EngineSession,
  playerId: string,
  tileId: string,
  hexId: string,
  rotation: number,
): TrackPlacementPreview {
  const state = getWorkingState(session);
  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    return {
      ok: false,
      costText: "费用未知",
      financeText: "找不到玩家。",
      linkText: "",
      reason: "找不到玩家。",
    };
  }

  const check = canPlaceTrack({
    map: state.map,
    player,
    tilePool: state.supply.tilePool,
    hexId,
    tileId,
    rotation,
  });

  if (!check.ok || check.cost == null) {
    return {
      ok: false,
      costText: "不可放置",
      financeText: check.reason ?? "当前方案非法。",
      linkText: "",
      reason: check.reason ?? "当前方案非法。",
    };
  }

  const shortfall = Math.max(0, check.cost - player.cash);
  const raised = Math.ceil(shortfall / 5) * 5;
  const financeText =
    shortfall <= 0
      ? `当前现金足够，无需融资。`
      : `当前现金不足 ${shortfall}，若确认将至少融资 ${raised}。`;

  return {
    ok: true,
    costText: `费用 ${check.cost}`,
    financeText,
    linkText: check.startsNewLink ? "这一步会启动一条新的线路。" : "这一步会接到你已有的线路上。",
  };
}

/**
 * 功能：把候选运货方案整理成更适合面板展示的摘要。
 * 参数：`session` 是当前会话，`candidate` 是一条已经合法的运输候选。
 * 返回：标题、路径、分数分配和简短规则解释。
 * 逻辑：把 link 使用量和首个同色城市的信息转成直白文本。
 */
export function getDeliveryPreview(session: EngineSession, candidate: DeliveryCandidate): DeliveryPreview {
  const state = getWorkingState(session);
  const payouts = Object.entries(candidate.pointsByOwner)
    .map(([ownerId, points]) => {
      const playerName = state.players.find((player) => player.id === ownerId)?.name ?? ownerId;
      return `${playerName} +${points}`;
    })
    .join("，");

  return {
    title: `${candidate.goodsColor} 货物：${candidate.sourceHexId} -> ${candidate.destinationHexId}`,
    pathText: `路径：${candidate.pathStopIds.join(" -> ")}；共 ${candidate.linkIds.length} 段。`,
    payoutText: payouts.length > 0 ? `线路分配：${payouts}。` : "线路上没有可得分的有主连接。",
    explanation: `该方案会在首个匹配颜色的城市 ${candidate.destinationHexId} 停止，并且当前玩家使用了至少一段自己的连接。`,
  };
}
