/**
 * 功能概述：展示当前顺位、当前行动者与已选行动牌。
 * 输入输出：输入顺位摘要；输出一个简洁的顺位面板。
 * 处理流程：按当前 turn order 逐项渲染，并高亮当前行动者。
 */

import type { TurnOrderEntryView } from "@steam/game-core";

export function TurnOrderPanel({ entries }: { entries: readonly TurnOrderEntryView[] }) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>顺位与行动牌</h2>
      <div style={listStyle}>
        {entries.map((entry, index) => (
          <div
            key={entry.playerId}
            style={{
              ...entryStyle,
              borderColor: entry.isCurrent ? "#8a4f2d" : "rgba(59,47,40,0.16)",
            }}
          >
            <div style={entryTitleStyle}>{index + 1}. {entry.playerName}</div>
            <div style={entryBodyStyle}>{entry.selectedTileLabel ?? "尚未选牌"}</div>
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

const listStyle = {
  display: "grid",
  gap: 6,
} as const;

const entryStyle = {
  padding: "6px 7px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.16)",
  background: "rgba(255,255,255,0.55)",
} as const;

const entryTitleStyle = {
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 2,
} as const;

const entryBodyStyle = {
  fontSize: 11.5,
  lineHeight: 1.25,
} as const;
