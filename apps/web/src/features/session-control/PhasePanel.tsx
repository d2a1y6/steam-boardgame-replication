/**
 * 功能概述：展示当前阶段摘要，并承接少量全局控制按钮。
 * 输入输出：输入阶段摘要和回调；输出阶段面板。
 * 处理流程：把当前回合、阶段、行动者和全局控制按钮集中展示。
 */

import type { PlayerState } from "@steam/game-core";

export interface PhaseControl {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

export function PhasePanel({
  summary,
  notice,
  controls,
}: {
  summary: { currentPlayer: PlayerState | null; phase: string; round: number; actionLabel?: string };
  notice: string;
  controls: readonly PhaseControl[];
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>当前阶段</h2>
      <div style={summaryGridStyle}>
        <div><strong>回合</strong> {summary.round}</div>
        <div><strong>阶段</strong> {summary.phase}</div>
        <div><strong>行动者</strong> {summary.currentPlayer?.name ?? "无"}</div>
        <div><strong>行动牌</strong> {summary.actionLabel ?? "尚未选择"}</div>
      </div>
      <p style={noticeStyle}>{notice}</p>
      <div style={buttonGridStyle}>
        {controls.map((control) => (
          <button
            key={control.id}
            style={buttonStyle}
            type="button"
            onClick={control.onClick}
            disabled={control.disabled}
          >
            {control.label}
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
  marginBottom: 7,
  fontSize: 15,
  lineHeight: 1.1,
} as const;

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "4px 10px",
  fontSize: 12.5,
  lineHeight: 1.25,
} as const;

const noticeStyle = {
  marginTop: 8,
  fontSize: 12.5,
  lineHeight: 1.35,
  color: "#3b2f28",
} as const;

const buttonGridStyle = {
  marginTop: 8,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 6,
} as const;

const buttonStyle = {
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.18)",
  background: "rgba(255,255,255,0.74)",
  cursor: "pointer",
} as const;
