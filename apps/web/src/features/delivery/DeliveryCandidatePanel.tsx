/**
 * 功能概述：列出当前货物源的候选运输方案，并允许切换选中项。
 * 输入输出：输入候选方案和当前选中方案；输出可点击的候选列表。
 * 处理流程：把目的地、路径长度和自得分压成短卡片。
 */

import type { DeliveryCandidate } from "@steam/game-core";

export function DeliveryCandidatePanel({
  candidates,
  selectedCandidateId,
  onSelect,
}: {
  candidates: readonly DeliveryCandidate[];
  selectedCandidateId: string | null;
  onSelect: (candidateId: string) => void;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>运输候选</h2>
      {candidates.length === 0 ? (
        <p style={emptyStyle}>当前没有合法运输方案。</p>
      ) : (
        <div style={listStyle}>
          {candidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onSelect(candidate.id)}
              style={{
                ...itemStyle,
                borderColor: candidate.id === selectedCandidateId ? "#8a4f2d" : "rgba(59,47,40,0.16)",
              }}
            >
              <div style={itemTitleStyle}>{candidate.sourceHexId} {"->"} {candidate.destinationHexId}</div>
              <div style={itemBodyStyle}>颜色 {candidate.goodsColor} / 长度 {candidate.linkIds.length} / 自得分 {candidate.selfPoints}</div>
            </button>
          ))}
        </div>
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

const emptyStyle = {
  fontSize: 12.5,
  lineHeight: 1.35,
} as const;

const listStyle = {
  display: "grid",
  gap: 6,
} as const;

const itemStyle = {
  padding: "7px 8px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.16)",
  background: "rgba(255,255,255,0.74)",
  textAlign: "left",
  cursor: "pointer",
} as const;

const itemTitleStyle = {
  fontSize: 12.5,
  fontWeight: 700,
  marginBottom: 2,
} as const;

const itemBodyStyle = {
  fontSize: 11.5,
  lineHeight: 1.25,
} as const;
