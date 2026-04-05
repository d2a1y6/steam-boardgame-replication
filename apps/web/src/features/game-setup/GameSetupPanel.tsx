/**
 * 功能概述：提供新对局设置入口，用于切换模式、地图与玩家规模。
 * 输入输出：输入当前设置值与回调；输出紧凑的设置面板。
 * 处理流程：收集模式、地图、玩家数、名字偏移与随机种子，再触发创建新对局。
 */

export interface GameMapOptionView {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface GameSetupView {
  mode: "base" | "standard";
  mapId: string;
  playerCount: number;
  nameOffset: number;
  seed: number;
}

export function GameSetupPanel({
  setup,
  mapOptions,
  onModeChange,
  onMapChange,
  onPlayerCountChange,
  onNameOffsetChange,
  onSeedChange,
  onCreate,
}: {
  setup: GameSetupView;
  mapOptions: readonly GameMapOptionView[];
  onModeChange: (value: GameSetupView["mode"]) => void;
  onMapChange: (value: string) => void;
  onPlayerCountChange: (value: number) => void;
  onNameOffsetChange: (value: number) => void;
  onSeedChange: (value: number) => void;
  onCreate: () => void;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>新对局</h2>
      <div style={fieldGridStyle}>
        <label style={labelStyle}>
          模式
          <select
            value={setup.mode}
            onChange={(event) => onModeChange(event.target.value as GameSetupView["mode"])}
            style={inputStyle}
          >
            <option value="base">Base Game</option>
            <option value="standard">Standard Game</option>
          </select>
        </label>
        <label style={labelStyle}>
          地图
          <select
            value={setup.mapId}
            onChange={(event) => onMapChange(event.target.value)}
            style={inputStyle}
          >
            {mapOptions.map((option) => (
              <option key={option.id} value={option.id} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
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
        <label style={labelStyle}>
          随机种子
          <input
            type="number"
            min={0}
            value={setup.seed}
            onChange={(event) => onSeedChange(Math.max(0, Number(event.target.value) || 0))}
            style={inputStyle}
          />
        </label>
      </div>
      <p style={metaStyle}>
        当前这版支持切换基础版与标准版；地图入口已接到设置面板，但 Ruhr 仍是占位数据，所以默认建议继续用东北美洲。
      </p>
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
