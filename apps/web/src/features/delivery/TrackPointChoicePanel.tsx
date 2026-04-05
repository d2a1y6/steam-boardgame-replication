/**
 * 功能概述：展示当前待决线路分，并让玩家选择加收入还是加胜利点。
 * 输入输出：输入当前玩家名、分值和两个回调；输出一个最小决策面板。
 * 处理流程：把“整次交付的分数不能拆分”这条规则显式呈现在界面上。
 */

export function TrackPointChoicePanel({
  playerName,
  points,
  onChooseIncome,
  onChooseVictoryPoints,
}: {
  playerName: string;
  points: number;
  onChooseIncome: () => void;
  onChooseVictoryPoints: () => void;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>分配线路分</h2>
      <p style={metaStyle}>{playerName} 本次交付得到 {points} 点线路分，必须整笔加到收入或整笔加到胜利点。</p>
      <div style={rowStyle}>
        <button type="button" style={buttonStyle} onClick={onChooseIncome}>全部加收入</button>
        <button type="button" style={buttonStyle} onClick={onChooseVictoryPoints}>全部加胜利点</button>
      </div>
    </section>
  );
}

const panelStyle = { background: "rgba(255,255,255,0.55)", padding: "10px 11px", borderRadius: 12, color: "#1f1a17" } as const;
const titleStyle = { marginBottom: 6, fontSize: 15, lineHeight: 1.1 } as const;
const metaStyle = { marginBottom: 8, fontSize: 12, lineHeight: 1.3 } as const;
const rowStyle = { display: "flex", gap: 8, flexWrap: "wrap" } as const;
const buttonStyle = { padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(59,47,40,0.18)", background: "rgba(255,255,255,0.74)", cursor: "pointer" } as const;
