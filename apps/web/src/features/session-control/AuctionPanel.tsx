/**
 * 功能概述：提供标准版顺位竞拍的最小工作台。
 * 输入输出：输入当前玩家、最高价和确认回调；输出出价与 pass 面板。
 * 处理流程：显示当前竞拍状态，并允许真人输入新的整数出价或直接 pass。
 */

import { useEffect, useState } from "react";

export function AuctionPanel({
  playerName,
  currentBid,
  onBid,
  onPass,
}: {
  playerName: string;
  currentBid: number;
  onBid: (bid: number) => void;
  onPass: () => void;
}) {
  const [bid, setBid] = useState(Math.max(0, currentBid + 1));

  useEffect(() => {
    setBid(Math.max(0, currentBid + 1));
  }, [currentBid]);

  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>标准版顺位竞拍</h2>
      <p style={metaStyle}>当前由 {playerName} 行动；你必须高于当前最高价，或直接选择 pass。</p>
      <div style={rowStyle}>
        <input
          type="number"
          min={Math.max(0, currentBid + 1)}
          value={bid}
          onChange={(event) => setBid(Math.max(0, Number(event.target.value) || 0))}
          style={inputStyle}
        />
        <button type="button" style={buttonStyle} onClick={() => onBid(bid)}>出价</button>
        <button type="button" style={buttonStyle} onClick={onPass}>Pass</button>
      </div>
      <div style={metaStyle}>当前最高价：${Math.max(0, currentBid)}</div>
    </section>
  );
}

const panelStyle = { background: "rgba(255,255,255,0.55)", padding: "10px 11px", borderRadius: 12, color: "#1f1a17" } as const;
const titleStyle = { marginBottom: 6, fontSize: 15, lineHeight: 1.1 } as const;
const metaStyle = { marginTop: 6, marginBottom: 0, fontSize: 12, lineHeight: 1.3 } as const;
const rowStyle = { display: "flex", gap: 8, alignItems: "center" } as const;
const inputStyle = { width: 90, padding: "6px 7px", borderRadius: 8, border: "1px solid rgba(59,47,40,0.18)", background: "rgba(255,255,255,0.74)" } as const;
const buttonStyle = { padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(59,47,40,0.18)", background: "rgba(255,255,255,0.74)", cursor: "pointer" } as const;
