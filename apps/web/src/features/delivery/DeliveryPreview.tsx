/**
 * 功能概述：展示当前选中运输方案的路径、收益和规则说明。
 * 输入输出：输入结构化运输预览对象；输出一块说明面板。
 * 处理流程：把原始路径、分配和 reason 在 Web 层格式化成三段展示。
 */

import type { DeliveryPreview as DeliveryPreviewModel } from "@steam/game-core";
import { presentRuleReason } from "../rule-help/presentRuleExplanation";

export function DeliveryPreview({ preview }: { preview: DeliveryPreviewModel | null }) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>运输预览</h2>
      {preview ? (
        <div style={bodyStyle}>
          <div style={sectionStyle}>
            <strong>{`${preview.goodsColor} 货物：${preview.sourceHexId} -> ${preview.destinationHexId}`}</strong>
          </div>
          <div style={sectionStyle}>{`路径：${preview.pathStopIds.join(" -> ")}；共 ${preview.linkCount} 段。`}</div>
          <div style={sectionStyle}>
            {preview.payouts.length > 0
              ? `线路分配：${preview.payouts.map((item) => `${item.playerName} +${item.points}`).join("，")}。`
              : "线路上没有可得分的有主连接。"}
          </div>
          <div style={sectionStyle}>{presentRuleReason(preview.explanation)}</div>
        </div>
      ) : (
        <p style={emptyStyle}>先选择一个货物源和候选方案。</p>
      )}
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
  display: "grid",
  gap: 5,
  fontSize: 12.5,
  lineHeight: 1.35,
} as const;

const sectionStyle = {
  margin: 0,
} as const;

const emptyStyle = {
  fontSize: 12.5,
  lineHeight: 1.35,
} as const;
