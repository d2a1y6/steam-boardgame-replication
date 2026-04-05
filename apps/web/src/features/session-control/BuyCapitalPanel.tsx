/**
 * 功能概述：提供标准版买资本阶段的最小工作台。
 * 输入输出：输入当前玩家名、建议档位和确认回调；输出一个紧凑面板。
 * 处理流程：让真人在 0 到 5 档之间选择一次买资本额度，并立刻提交。
 */

import { useState } from "react";

export function BuyCapitalPanel({
  playerName,
  onConfirm,
}: {
  playerName: string;
  onConfirm: (steps: number) => void;
}) {
  const [steps, setSteps] = useState(2);

  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>买资本</h2>
      <p style={metaStyle}>当前由 {playerName} 决定本回合买多少资本；每退 1 格收入，换取 $5 现金。</p>
      <div style={rowStyle}>
        <select value={steps} onChange={(event) => setSteps(Number(event.target.value))} style={inputStyle}>
          {Array.from({ length: 6 }, (_, index) => (
            <option key={index} value={index}>
              {index} 格 / ${index * 5}
            </option>
          ))}
        </select>
        <button type="button" style={buttonStyle} onClick={() => onConfirm(steps)}>确认</button>
      </div>
    </section>
  );
}

const panelStyle = { background: "rgba(255,255,255,0.55)", padding: "10px 11px", borderRadius: 12, color: "#1f1a17" } as const;
const titleStyle = { marginBottom: 6, fontSize: 15, lineHeight: 1.1 } as const;
const metaStyle = { marginBottom: 8, fontSize: 12, lineHeight: 1.3 } as const;
const rowStyle = { display: "flex", gap: 8, alignItems: "center" } as const;
const inputStyle = { padding: "6px 7px", borderRadius: 8, border: "1px solid rgba(59,47,40,0.18)", background: "rgba(255,255,255,0.74)" } as const;
const buttonStyle = { padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(59,47,40,0.18)", background: "rgba(255,255,255,0.74)", cursor: "pointer" } as const;
