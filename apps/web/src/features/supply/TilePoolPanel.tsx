/**
 * 功能概述：展示轨道板库存摘要，并高亮当前选中的轨道板。
 * 输入输出：输入 tile pool 摘要和当前选中项；输出可读的库存面板。
 * 处理流程：逐项渲染 tile id、剩余量、类别与基础费用。
 */

import type { TilePoolSummaryView } from "@steam/game-core";

export function TilePoolPanel({
  items,
  selectedTileId,
}: {
  items: readonly TilePoolSummaryView[];
  selectedTileId: string | null;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>轨道库存</h2>
      <div style={gridStyle}>
        {items.map((item) => (
          <div
            key={item.tileId}
            style={{
              ...itemStyle,
              borderColor: item.tileId === selectedTileId ? "#8a4f2d" : "rgba(59,47,40,0.16)",
            }}
          >
            <div style={itemTitleStyle}>{item.tileId} {item.isTownTile ? "城镇板" : "普通板"}</div>
            <div style={itemBodyStyle}>剩余 {item.count} / 基础费用 {item.baseCost}</div>
          </div>
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
  gap: 6,
} as const;

const itemStyle = {
  padding: "6px 7px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.16)",
  background: "rgba(255,255,255,0.55)",
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
