/**
 * 功能概述：让玩家在建轨阶段先选择要使用的轨道板。
 * 输入输出：输入轨道板列表、当前选中项和回调；输出一个可点击的板块选择区。
 * 处理流程：按库存和类别渲染按钮，并高亮当前选中项。
 */

import type { TrackPaletteOptionView } from "@steam/game-core";

export function TrackPalettePanel({
  items,
  selectedTileId,
  onSelect,
}: {
  items: readonly TrackPaletteOptionView[];
  selectedTileId: string | null;
  onSelect: (tileId: string) => void;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>建轨板选择</h2>
      <div style={gridStyle}>
        {items.map((item) => (
          <button
            key={item.tileId}
            type="button"
            disabled={item.disabled}
            onClick={() => onSelect(item.tileId)}
            style={{
              ...itemStyle,
              opacity: item.disabled ? 0.52 : 1,
              borderColor: item.tileId === selectedTileId ? "#8a4f2d" : "rgba(59,47,40,0.16)",
              cursor: item.disabled ? "default" : "pointer",
            }}
          >
            <div style={itemTitleStyle}>{item.label}</div>
            <div style={itemBodyStyle}>剩余 {item.count} / 基础费用 {item.baseCost}</div>
          </button>
        ))}
      </div>
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

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 6,
} as const;

const itemStyle = {
  padding: "7px 8px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.16)",
  background: "rgba(255,255,255,0.74)",
  textAlign: "left",
} as const;

const itemTitleStyle = {
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 2,
} as const;

const itemBodyStyle = {
  fontSize: 11.5,
  lineHeight: 1.25,
} as const;
