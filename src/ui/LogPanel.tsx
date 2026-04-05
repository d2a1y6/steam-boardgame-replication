/**
 * 功能概述：展示最近的动作日志与提示日志。
 * 输入输出：输入日志数组；输出按时间顺序的日志列表。
 * 处理流程：只展示最近若干条，保证第一阶段界面足够轻。
 */

import type { GameLogEntry } from "../state/gameState";

export function LogPanel({ logs }: { logs: GameLogEntry[] }) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>日志</h2>
      <ul style={listStyle}>
        {logs.slice(-12).map((log) => (
          <li key={log.id} style={itemStyle}>{log.message}</li>
        ))}
      </ul>
    </section>
  );
}

const panelStyle = {
  background: "rgba(255,255,255,0.55)",
  padding: "10px 11px",
  borderRadius: 12,
  minHeight: 0,
  overflow: "auto",
  color: "#1f1a17",
} as const;

const titleStyle = {
  marginBottom: 6,
  fontSize: 15,
  lineHeight: 1.1,
} as const;

const listStyle = {
  margin: 0,
  paddingLeft: 17,
  fontSize: 12.5,
  lineHeight: 1.35,
} as const;

const itemStyle = {
  marginBottom: 4,
} as const;
