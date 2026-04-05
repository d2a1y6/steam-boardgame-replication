/**
 * 功能概述：展示当前选中运输方案的路径、收益和规则说明。
 * 输入输出：输入运输预览对象；输出一块说明面板。
 * 处理流程：把路径、分配与解释分三段展示。
 */

import type { DeliveryPreview as DeliveryPreviewModel } from "../engine/previews";

export function DeliveryPreview({ preview }: { preview: DeliveryPreviewModel | null }) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>运输预览</h2>
      {preview ? (
        <div style={bodyStyle}>
          <div style={sectionStyle}><strong>{preview.title}</strong></div>
          <div style={sectionStyle}>{preview.pathText}</div>
          <div style={sectionStyle}>{preview.payoutText}</div>
          <div style={sectionStyle}>{preview.explanation}</div>
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
