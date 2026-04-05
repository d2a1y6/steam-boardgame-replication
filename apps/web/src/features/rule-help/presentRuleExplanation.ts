/**
 * 功能概述：把 core 返回的结构化规则 reason 渲染成当前 Web 页面需要的中文解释文本。
 * 输入输出：输入 explanation model 或单条 reason；输出标题、正文和补充说明字符串。
 * 处理流程：按 code 分发到 presenter，再根据 context 拼出当前页面使用的教学文案。
 */

import type { RuleExplanationModel, RuleReason, RuleReasonContextValue } from "@steam/game-core";

export interface PresentedRuleExplanation {
  readonly title: string;
  readonly body: string;
  readonly detail?: string;
}

function asString(value: RuleReasonContextValue | undefined) {
  if (value == null) {
    return "";
  }
  return String(value);
}

function asStringArray(value: RuleReasonContextValue | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item));
}

function asNumber(value: RuleReasonContextValue | undefined) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

/**
 * 功能：把一条结构化 reason 转成中文文本。
 * 参数：`reason` 是 core 侧返回的结构化说明。
 * 返回：当前 Web 页面对这条 reason 的文本表达。
 * 逻辑：只在 presenter 层拼接中文句子，避免 core 直接承担展示职责。
 */
export function presentRuleReason(reason: RuleReason): string {
  switch (reason.code) {
    case "BOT_TURN_TITLE":
      return "当前轮到 Bot";
    case "BOT_TURN_BODY":
      return "你可以点“推进到我的回合”让系统代走，直到再次轮到你。";
    case "TRACK_PREVIEW_TITLE":
      return "建轨解释";
    case "TRACK_PREVIEW_BODY":
      if (asNumber(reason.context?.shortfall) <= 0) {
        return `费用 ${asNumber(reason.context?.cost)}。当前现金足够，无需融资。`;
      }
      return `费用 ${asNumber(reason.context?.cost)}。当前现金不足 ${asNumber(reason.context?.shortfall)}，若确认将至少融资 ${asNumber(reason.context?.raised)}。`;
    case "TRACK_PREVIEW_DETAIL":
      return reason.context?.startsNewLink ? "这一步会启动一条新的线路。" : "这一步会接到你已有的线路上。";
    case "DELIVERY_PREVIEW_TITLE":
      return "运货解释";
    case "DELIVERY_PREVIEW_BODY":
      return `路径：${asStringArray(reason.context?.pathStopIds).join(" -> ")}；共 ${asNumber(reason.context?.linkCount)} 段。`;
    case "DELIVERY_PREVIEW_DETAIL":
      return `${asStringArray(reason.context?.payoutLabels).length > 0 ? `线路分配：${asStringArray(reason.context?.payoutLabels).join("，")}。` : "线路上没有可得分的有主连接。"} 该方案会在首个匹配颜色的城市 ${asString(reason.context?.destinationHexId)} 停止，并且当前玩家使用了至少一段自己的连接。`.trim();
    case "DELIVERY_RULE_TEXT":
      return `该方案会在首个匹配颜色的城市 ${asString(reason.context?.destinationHexId)} 停止，并且当前玩家使用了至少一段自己的连接。`;
    case "SELECT_ACTION_TITLE":
      return "行动牌阶段";
    case "SELECT_ACTION_BODY":
      return "先选一张未被占用的行动牌。行动牌既决定顺位，也决定后续阶段的特殊能力。";
    case "BUILD_TRACK_TITLE":
      return "建轨阶段";
    case "BUILD_TRACK_BODY":
      return "先选轨道板，再点地图上的高亮 hex，最后在工作台里确认朝向和费用。";
    case "MOVE_GOODS_TITLE":
      return "货运阶段";
    case "MOVE_GOODS_BODY":
      return "先选货物源，再选候选方案。系统已经把合法路径与得分分配缩成了少量可选方案。";
    case "GENERIC_PHASE_TITLE":
      return "阶段说明";
    case "NOTICE_TEXT":
      return asString(reason.context?.text);
    default:
      return reason.code;
  }
}

/**
 * 功能：把 core 解释模型转成最终展示文本。
 * 参数：`model` 是由 core 生成的 explanation model。
 * 返回：供规则解释面板直接渲染的标题、正文和补充说明。
 * 逻辑：逐段调用 presenter，确保文本只在 Web 层落地。
 */
export function presentRuleExplanation(model: RuleExplanationModel): PresentedRuleExplanation {
  return {
    title: presentRuleReason(model.title),
    body: presentRuleReason(model.body),
    detail: model.detail ? presentRuleReason(model.detail) : undefined,
  };
}
