/**
 * 功能概述：展示结构化的规则解释，而不是直接渲染 core 返回的 code + context。
 * 输入输出：输入 core explanation model；输出一块教学说明面板。
 * 处理流程：先走 Web presenter，再把标题、正文和补充说明分层呈现。
 */

import type { RuleExplanationModel } from "@steam/game-core";
import { presentRuleExplanation } from "./presentRuleExplanation";

export function RuleExplanationPanel({ explanation }: { explanation: RuleExplanationModel }) {
  const presented = presentRuleExplanation(explanation);

  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>{presented.title}</h2>
      <p style={bodyStyle}>{presented.body}</p>
      {presented.detail ? <p style={detailStyle}>{presented.detail}</p> : null}
    </section>
  );
}

const panelStyle = {
  background: "rgba(255,255,255,0.55)",
  padding: "10px 11px",
  borderRadius: 12,
  color: "#1f1a17",
} as const;

const titleStyle = {
  marginBottom: 6,
  fontSize: 15,
  lineHeight: 1.1,
} as const;

const bodyStyle = {
  fontSize: 12.5,
  lineHeight: 1.35,
} as const;

const detailStyle = {
  marginTop: 6,
  fontSize: 11.5,
  lineHeight: 1.3,
  color: "#4b5563",
} as const;
