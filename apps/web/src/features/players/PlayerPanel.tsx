/**
 * 功能概述：显示玩家的经济状态、机车等级和当前行动标记。
 * 输入输出：输入玩家列表与当前玩家 id；输出玩家面板。
 * 处理流程：逐个渲染玩家卡片并高亮当前行动者。
 */

import type { PlayerState } from "@steam/game-core";

export function PlayerPanel({ players, currentPlayerId }: { players: PlayerState[]; currentPlayerId: string | null }) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>玩家</h2>
      <div style={gridStyle}>
        {players.map((player) => (
          <div
            key={player.id}
            style={{
              padding: "7px 8px",
              borderRadius: 9,
              border: player.id === currentPlayerId ? "2px solid #8a4f2d" : "1px solid rgba(59,47,40,0.2)",
              background: "rgba(255,255,255,0.55)",
              fontSize: 12.5,
              lineHeight: 1.3,
            }}
          >
            <div style={{ fontWeight: 700 }}>{player.name}{player.isBot ? " [Bot]" : ""}</div>
            <div>现金 {player.cash} / 收入 {player.income}</div>
            <div>VP {player.victoryPoints} / 机车 {player.locomotiveLevel}</div>
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
  marginBottom: 7,
  fontSize: 15,
  lineHeight: 1.1,
} as const;

const gridStyle = {
  display: "grid",
  gap: 6,
  gridTemplateColumns: "repeat(auto-fit, minmax(136px, 1fr))",
} as const;
