/**
 * 功能概述：提供本地存档、载入和删除入口。
 * 输入输出：输入存档摘要列表与回调；输出一个本地存档面板。
 * 处理流程：先显示当前保存入口，再列出已有存档并提供载入/删除按钮。
 */

import type { SavedGameEntry } from "./browserSaveRepository";

export function SaveLoadPanel({
  saves,
  onSave,
  onLoad,
  onDelete,
}: {
  saves: readonly SavedGameEntry[];
  onSave: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>存档</h2>
      <button type="button" style={saveButtonStyle} onClick={onSave}>保存当前对局</button>
      <div style={listStyle}>
        {saves.length === 0 ? (
          <p style={emptyStyle}>当前还没有本地存档。</p>
        ) : (
          saves.map((save) => (
            <div key={save.id} style={itemStyle}>
              <div style={itemTitleStyle}>{save.label}</div>
              <div style={itemBodyStyle}>{save.mode} / {save.mapName} / 第 {save.round} 回合 / {save.phase}</div>
              <div style={itemBodyStyle}>{save.players.join(", ")}</div>
              <div style={buttonRowStyle}>
                <button type="button" style={miniButtonStyle} onClick={() => onLoad(save.id)}>载入</button>
                <button type="button" style={miniButtonStyle} onClick={() => onDelete(save.id)}>删除</button>
              </div>
            </div>
          ))
        )}
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

const saveButtonStyle = {
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.18)",
  background: "rgba(255,255,255,0.74)",
  cursor: "pointer",
  marginBottom: 8,
} as const;

const listStyle = {
  display: "grid",
  gap: 6,
} as const;

const emptyStyle = {
  fontSize: 12.5,
  lineHeight: 1.35,
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

const buttonRowStyle = {
  marginTop: 6,
  display: "flex",
  gap: 6,
} as const;

const miniButtonStyle = {
  padding: "5px 7px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.18)",
  background: "rgba(255,255,255,0.74)",
  cursor: "pointer",
} as const;
