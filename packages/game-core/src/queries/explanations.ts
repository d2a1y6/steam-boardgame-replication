/**
 * 功能概述：统一生成当前阶段的教学解释、非法原因和预览说明。
 * 输入输出：输入会话与当前 UI 选择态；输出结构化 reason model，而不是最终展示文案。
 * 处理流程：按阶段分流，再把建轨和运货预览转换成 code + context 形式的解释段落。
 */

import type { RuleReason } from "../contracts/domain";
import type { DeliveryCandidate } from "../state/gameState";
import type { EngineSession } from "../contracts/engine";
import type { TrackPlacementPreview } from "./previews";
import { getWorkingState } from "../actions/draftSession";
import { getDeliveryPreview } from "./previews";

export interface RuleExplanationModel {
  readonly title: RuleReason;
  readonly body: RuleReason;
  readonly detail?: RuleReason;
}

function reason(code: string, context?: RuleReason["context"]): RuleReason {
  return { code, context };
}

/**
 * 功能：生成当前阶段的规则解释。
 * 参数：会话、是否轮到真人、当前提示、建轨预览和运输候选。
 * 返回：结构化解释对象，供专门面板渲染。
 * 逻辑：优先显示当前最具体的对象解释，其次回退到阶段说明。
 */
export function getRuleExplanation(options: {
  session: EngineSession;
  isHumanTurn: boolean;
  notice: string;
  trackPreview: TrackPlacementPreview | null;
  selectedCandidate: DeliveryCandidate | null;
}): RuleExplanationModel {
  const state = getWorkingState(options.session);

  if (!options.isHumanTurn) {
    return {
      title: reason("BOT_TURN_TITLE"),
      body: reason("BOT_TURN_BODY"),
      detail: reason("NOTICE_TEXT", { text: options.notice }),
    };
  }

  if (options.trackPreview) {
    return {
      title: reason("TRACK_PREVIEW_TITLE"),
      body: reason("TRACK_PREVIEW_BODY", {
        cost: options.trackPreview.cost ?? 0,
        shortfall: options.trackPreview.shortfall,
        raised: options.trackPreview.raised,
      }),
      detail: reason("TRACK_PREVIEW_DETAIL", {
        startsNewLink: Boolean(options.trackPreview.startsNewLink),
      }),
    };
  }

  if (options.selectedCandidate) {
    const preview = getDeliveryPreview(options.session, options.selectedCandidate);
    return {
      title: reason("DELIVERY_PREVIEW_TITLE"),
      body: reason("DELIVERY_PREVIEW_BODY", {
        pathStopIds: preview.pathStopIds,
        linkCount: preview.linkCount,
      }),
      detail: reason("DELIVERY_PREVIEW_DETAIL", {
        payoutLabels: preview.payouts.map((payout) => `${payout.playerName} +${payout.points}`),
        destinationHexId: preview.destinationHexId,
      }),
    };
  }

  if (state.turn.phase === "select-action") {
    return {
      title: reason("SELECT_ACTION_TITLE"),
      body: reason("SELECT_ACTION_BODY"),
      detail: reason("NOTICE_TEXT", { text: options.notice }),
    };
  }

  if (state.turn.phase === "build-track") {
    const activePlayerId = state.turn.buildOrder[state.turn.currentPlayerIndex] ?? state.turn.turnOrder[state.turn.currentPlayerIndex] ?? null;
    const pendingBuildAction = activePlayerId ? state.turn.pendingBuildActions?.[activePlayerId] ?? null : null;
    if (pendingBuildAction === "city-growth") {
      return {
        title: reason("CITY_GROWTH_TITLE"),
        body: reason("CITY_GROWTH_BODY"),
        detail: reason("NOTICE_TEXT", { text: options.notice }),
      };
    }
    if (pendingBuildAction === "urbanization") {
      return {
        title: reason("URBANIZATION_TITLE"),
        body: reason("URBANIZATION_BODY"),
        detail: reason("NOTICE_TEXT", { text: options.notice }),
      };
    }
    return {
      title: reason("BUILD_TRACK_TITLE"),
      body: reason("BUILD_TRACK_BODY"),
      detail: reason("NOTICE_TEXT", { text: options.notice }),
    };
  }

  if (state.turn.phase === "buy-capital") {
    return {
      title: reason("BUY_CAPITAL_TITLE"),
      body: reason("BUY_CAPITAL_BODY"),
      detail: reason("NOTICE_TEXT", { text: options.notice }),
    };
  }

  if (state.turn.phase === "auction-turn-order") {
    return {
      title: reason("STANDARD_AUCTION_TITLE"),
      body: reason("STANDARD_AUCTION_BODY"),
      detail: reason("NOTICE_TEXT", { text: options.notice }),
    };
  }

  if (state.turn.phase === "move-goods-round-1" || state.turn.phase === "move-goods-round-2") {
    return {
      title: reason("MOVE_GOODS_TITLE"),
      body: reason("MOVE_GOODS_BODY"),
      detail: reason("NOTICE_TEXT", { text: options.notice }),
    };
  }

  if (state.turn.phase === "resolve-delivery") {
    const currentChoice = state.turn.pendingDeliveryResolution?.queue[0] ?? null;
    return {
      title: reason("TRACK_POINT_CHOICE_TITLE"),
      body: reason("TRACK_POINT_CHOICE_BODY", {
        points: currentChoice?.points ?? 0,
      }),
      detail: reason("NOTICE_TEXT", { text: options.notice }),
    };
  }

  return {
    title: reason("GENERIC_PHASE_TITLE"),
    body: reason("NOTICE_TEXT", { text: options.notice }),
  };
}
