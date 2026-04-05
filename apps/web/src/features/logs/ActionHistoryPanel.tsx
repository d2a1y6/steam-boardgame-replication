/**
 * 功能概述：展示最近的显式动作历史，帮助玩家理解当前局面是怎样一步步形成的。
 * 输入输出：输入引擎会话中的动作记录数组；输出一个紧凑的历史面板。
 * 处理流程：按时间倒序展示最近若干条动作，并给出回合与阶段标签。
 */

import type { SessionActionRecord } from "@steam/game-core";

/**
 * 功能：渲染最近动作历史。
 * 参数：`items` 是会话中累计保存的动作记录。
 * 返回：一个按时间倒序排列的动作历史面板。
 * 逻辑：只展示最近 12 条，避免信息列被历史完全占满。
 */
export function ActionHistoryPanel({ items }: { items: readonly SessionActionRecord[] }) {
  const visibleItems = items.slice(-12).reverse();

  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>动作历史</h2>
      {visibleItems.length === 0 ? (
        <p style={emptyStyle}>当前还没有显式动作记录。</p>
      ) : (
        <div style={listStyle}>
          {visibleItems.map((item) => (
            <div key={`${item.index}-${item.summary}`} style={itemStyle}>
              <div style={itemTitleStyle}>{item.summary}</div>
              <div style={itemBodyStyle}>第 {item.round} 回合 / {item.phase}</div>
            </div>
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
  maxHeight: 220,
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
} as const;
