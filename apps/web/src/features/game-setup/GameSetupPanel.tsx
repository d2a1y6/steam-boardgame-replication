/**
 * 功能概述：提供新对局设置入口，用于重开当前这版可交付的基础局。
 * 输入输出：输入当前设置值与回调；输出紧凑的设置面板。
 * 处理流程：收集玩家数、起始名字偏移与当前范围说明，再触发创建新对局。
 */

export interface GameSetupView {
  playerCount: number;
  nameOffset: number;
}

export function GameSetupPanel({
  setup,
  onPlayerCountChange,
  onNameOffsetChange,
  onCreate,
}: {
  setup: GameSetupView;
  onPlayerCountChange: (value: number) => void;
  onNameOffsetChange: (value: number) => void;
  onCreate: () => void;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>新对局</h2>
      <div style={fieldGridStyle}>
        <label style={labelStyle}>
          玩家数
          <select
            value={setup.playerCount}
            onChange={(event) => onPlayerCountChange(Number(event.target.value))}
            style={inputStyle}
          >
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
        </label>
        <label style={labelStyle}>
          名字偏移
          <input
            type="number"
            min={0}
            value={setup.nameOffset}
            onChange={(event) => onNameOffsetChange(Math.max(0, Number(event.target.value) || 0))}
            style={inputStyle}
          />
        </label>
      </div>
      <p style={metaStyle}>当前这版会重开基础版东北美洲对局，并沿用“1 真人 + 若干 Bot”的学习壳。</p>
      <button type="button" style={buttonStyle} onClick={onCreate}>创建新对局</button>
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

const fieldGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 6,
} as const;

const labelStyle = {
  display: "grid",
  gap: 4,
  fontSize: 12,
} as const;

const inputStyle = {
  padding: "6px 7px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.18)",
  background: "rgba(255,255,255,0.74)",
} as const;

const metaStyle = {
  marginTop: 8,
  marginBottom: 8,
  fontSize: 11.5,
  lineHeight: 1.3,
} as const;

const buttonStyle = {
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.18)",
  background: "rgba(255,255,255,0.74)",
  cursor: "pointer",
} as const;
