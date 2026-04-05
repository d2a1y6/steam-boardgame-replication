/**
 * 功能概述：展示货物供应区、货物袋摘要与新城市板剩余量。
 * 输入输出：输入公共供给数据；输出一块紧凑的公共信息面板。
 * 处理流程：先显示 supply groups，再显示袋中与新城市板摘要。
 */

import type { SupplyGroup } from "../state/gameState";

export function GoodsSupplyPanel({
  goodsSupply,
  goodsBagCount,
  newCityTilesCount,
}: {
  goodsSupply: readonly SupplyGroup[];
  goodsBagCount: number;
  newCityTilesCount: number;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>公共货物</h2>
      <div style={summaryStyle}>货物袋剩余 {goodsBagCount}；新城市板剩余 {newCityTilesCount}。</div>
      <div style={gridStyle}>
        {goodsSupply.map((group) => (
          <div key={group.id} style={groupStyle}>
            <div style={groupTitleStyle}>{group.id}</div>
            <div style={groupBodyStyle}>{group.cubes.join(" / ")}</div>
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

const summaryStyle = {
  marginBottom: 8,
  fontSize: 12.5,
  lineHeight: 1.3,
} as const;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 6,
} as const;

const groupStyle = {
  padding: "6px 7px",
  borderRadius: 8,
  background: "rgba(255,255,255,0.55)",
  fontSize: 11.5,
} as const;

const groupTitleStyle = {
  fontWeight: 700,
  marginBottom: 2,
} as const;

const groupBodyStyle = {
  lineHeight: 1.25,
} as const;
