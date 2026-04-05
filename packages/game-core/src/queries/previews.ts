/**
 * 功能概述：为建轨和运货提供界面预览摘要。
 * 输入输出：输入当前会话、候选动作或方案；输出原始事实数据与结构化 reason。
 * 处理流程：把规则函数的原始结果整理成 UI 更容易消费的预览模型，但不直接产出最终展示句子。
 */

import type { RuleReason } from "../contracts/domain";
import type { DeliveryCandidate } from "../state/gameState";
import type { EngineSession } from "../contracts/engine";
import { getWorkingState } from "../actions/draftSession";
import { canPlaceTrack } from "../rules/trackPlacement";

export interface TrackPlacementPreview {
  readonly ok: boolean;
  readonly cost: number | null;
  readonly shortfall: number;
  readonly raised: number;
  readonly startsNewLink: boolean | null;
  readonly reason?: RuleReason;
}

export interface DeliveryPayoutPreview {
  readonly playerId: string;
  readonly playerName: string;
  readonly points: number;
}

export interface DeliveryPreview {
  readonly goodsColor: string;
  readonly sourceHexId: string;
  readonly destinationHexId: string;
  readonly pathStopIds: readonly string[];
  readonly linkCount: number;
  readonly payouts: readonly DeliveryPayoutPreview[];
  readonly explanation: RuleReason;
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
      cost: null,
      shortfall: 0,
      raised: 0,
      startsNewLink: null,
      reason: { code: "NOTICE_TEXT", context: { text: "找不到玩家。" } },
    };
  }

  const check = canPlaceTrack({
    map: state.map,
    tileManifest: state.content.tileManifest,
    player,
    tilePool: state.supply.tilePool,
    hexId,
    tileId,
    rotation,
  });

  if (!check.ok || check.cost == null) {
    return {
      ok: false,
      cost: null,
      shortfall: 0,
      raised: 0,
      startsNewLink: null,
      reason: { code: "NOTICE_TEXT", context: { text: check.reason ?? "当前方案非法。" } },
    };
  }

  const shortfall = Math.max(0, check.cost - player.cash);
  const raised = Math.ceil(shortfall / 5) * 5;

  return {
    ok: true,
    cost: check.cost,
    shortfall,
    raised,
    startsNewLink: Boolean(check.startsNewLink),
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
      return {
        playerId: ownerId,
        playerName,
        points,
      };
    });

  return {
    goodsColor: candidate.goodsColor,
    sourceHexId: candidate.sourceHexId,
    destinationHexId: candidate.destinationHexId,
    pathStopIds: [...candidate.pathStopIds],
    linkCount: candidate.linkIds.length,
    payouts,
    explanation: {
      code: "DELIVERY_RULE_TEXT",
      context: {
        destinationHexId: candidate.destinationHexId,
      },
    },
  };
}
