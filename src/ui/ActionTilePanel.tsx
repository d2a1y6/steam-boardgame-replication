/**
 * 功能概述：展示行动牌占用情况，并允许真人在选牌阶段直接选择。
 * 输入输出：输入行动牌列表、当前玩家和回调；输出行动牌按钮面板。
 * 处理流程：把牌面价值、占用状态和可选状态压成一组按钮。
 */

import type { SelectableActionTileView } from "../engine/legalMoves";

export function ActionTilePanel({
  tiles,
  currentPlayerName,
  onSelect,
}: {
  tiles: readonly SelectableActionTileView[];
  currentPlayerName: string;
  onSelect: (tileId: string) => void;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>行动牌</h2>
      <p style={metaStyle}>当前由 {currentPlayerName} 选牌。</p>
      <div style={gridStyle}>
        {tiles.map((tile) => (
          <button
            key={tile.tileId}
            type="button"
            disabled={tile.disabled}
            onClick={() => onSelect(tile.tileId)}
            style={{
              ...buttonStyle,
              opacity: tile.disabled ? 0.52 : 1,
              cursor: tile.disabled ? "default" : "pointer",
            }}
          >
            <div style={buttonTitleStyle}>{tile.label}</div>
            <div style={buttonMetaStyle}>顺位值 {tile.value}</div>
            <div style={buttonMetaStyle}>
              {tile.selectedByPlayerId ? `已被 ${tile.selectedByPlayerId} 选走` : "可选择"}
            </div>
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

const metaStyle = {
  marginBottom: 8,
  fontSize: 12.5,
  lineHeight: 1.3,
} as const;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 6,
} as const;

const buttonStyle = {
  padding: "8px 9px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.18)",
  background: "rgba(255,255,255,0.76)",
  textAlign: "left",
} as const;

const buttonTitleStyle = {
  fontSize: 12.5,
  fontWeight: 700,
  marginBottom: 2,
} as const;

const buttonMetaStyle = {
  fontSize: 11.5,
  lineHeight: 1.25,
} as const;
