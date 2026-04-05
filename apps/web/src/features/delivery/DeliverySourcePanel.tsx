/**
 * 功能概述：列出当前玩家可运输的货物源，作为运输阶段的第一步选择。
 * 输入输出：输入可运输货物源列表与当前选中项；输出一个可点击的源选择面板。
 * 处理流程：按“城市 + 颜色”展示来源，并附带候选方案数量。
 */

import type { GoodsSourceOptionView } from "@steam/game-core";

export function DeliverySourcePanel({
  sources,
  selectedSourceId,
  onSelect,
}: {
  sources: readonly GoodsSourceOptionView[];
  selectedSourceId: string | null;
  onSelect: (sourceId: string) => void;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>货物源</h2>
      {sources.length === 0 ? (
        <p style={emptyStyle}>当前没有可运输货物。</p>
      ) : (
        <div style={listStyle}>
          {sources.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => onSelect(source.id)}
              style={{
                ...itemStyle,
                borderColor: source.id === selectedSourceId ? "#8a4f2d" : "rgba(59,47,40,0.16)",
              }}
            >
              <div style={itemTitleStyle}>{source.sourceHexId} / {source.goodsColor}</div>
              <div style={itemBodyStyle}>候选方案 {source.candidateCount}</div>
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
