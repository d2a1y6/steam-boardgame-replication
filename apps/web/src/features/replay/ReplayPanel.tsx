/**
 * 功能概述：展示最近的回放帧，并允许恢复到指定帧。
 * 输入输出：输入回放帧列表与回调；输出一个回放时间线面板。
 * 处理流程：按时间倒序列出摘要，并提供“恢复到此处”入口。
 */

import type { ReplayFrame } from "@steam/game-core";

export function ReplayPanel({
  frames,
  onRestore,
}: {
  frames: readonly ReplayFrame[];
  onRestore: (frameId: string) => void;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>回放时间线</h2>
      <div style={listStyle}>
        {frames.slice(-12).reverse().map((frame) => (
          <div key={frame.id} style={itemStyle}>
            <div style={itemTitleStyle}>{frame.label}</div>
            <div style={itemBodyStyle}>第 {frame.round} 回合 / {frame.phase} / {frame.activePlayerName}</div>
            <button type="button" style={buttonStyle} onClick={() => onRestore(frame.id)}>恢复到此帧</button>
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
  maxHeight: 280,
  overflow: "auto",
} as const;

const itemStyle = {
  padding: "7px 8px",
  borderRadius: 8,
  background: "rgba(255,255,255,0.55)",
} as const;

const itemTitleStyle = {
  fontSize: 12.5,
  fontWeight: 700,
  marginBottom: 2,
} as const;

const itemBodyStyle = {
  fontSize: 11.5,
  lineHeight: 1.25,
  marginBottom: 6,
} as const;

const buttonStyle = {
  padding: "5px 7px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.18)",
  background: "rgba(255,255,255,0.74)",
  cursor: "pointer",
} as const;
