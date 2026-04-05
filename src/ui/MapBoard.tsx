/**
 * 功能概述：用紧凑 SVG 展示地图、可点击 hex、高亮路径与当前轨道数量。
 * 输入输出：输入当前游戏状态和若干高亮控制；输出可交互的可视化棋盘。
 * 处理流程：按 axial 坐标布局 hex，再叠加选中、候选与运输路径高亮。
 */

import type { GameState } from "../state/gameState";

function hexPoint(cx: number, cy: number, radius: number, index: number) {
  const angle = (Math.PI / 180) * (60 * index - 30);
  return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
}

export function MapBoard({
  game,
  clickableHexIds = [],
  highlightedHexIds = [],
  selectedHexId = null,
  onHexClick,
}: {
  game: GameState;
  clickableHexIds?: readonly string[];
  highlightedHexIds?: readonly string[];
  selectedHexId?: string | null;
  onHexClick?: (hexId: string) => void;
}) {
  const radius = 31;
  const width = 560;
  const height = 350;
  const clickable = new Set(clickableHexIds);
  const highlighted = new Set(highlightedHexIds);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height: "100%", display: "block", background: "rgba(255,255,255,0.36)", borderRadius: 12 }}
      preserveAspectRatio="xMidYMid meet"
    >
      {game.map.definition.hexes.map((hex) => {
        const x = 200 + hex.q * 60 + hex.r * 30;
        const y = 150 + hex.r * 52;
        const points = Array.from({ length: 6 }, (_, index) => hexPoint(x, y, radius, index)).join(" ");
        const fill = hex.terrain === "city" ? "#c96d56" : hex.terrain === "hills" ? "#b99768" : "#9dbf7a";
        const goodsCount = game.map.cityGoods[hex.id]?.length ?? 0;
        const trackCount = game.map.trackPieces.filter((track) => track.hexId === hex.id).length;
        const isClickable = clickable.has(hex.id);
        const isHighlighted = highlighted.has(hex.id);
        const isSelected = selectedHexId === hex.id;

        return (
          <g key={hex.id} onClick={isClickable ? () => onHexClick?.(hex.id) : undefined} style={{ cursor: isClickable ? "pointer" : "default" }}>
            <polygon
              points={points}
              fill={fill}
              stroke={isSelected ? "#f4d06f" : isHighlighted ? "#2563eb" : "#3b2f28"}
              strokeWidth={isSelected || isHighlighted ? "3" : "2"}
              opacity={isClickable || highlighted.size === 0 ? 1 : 0.78}
            />
            <text x={x} y={y - 5} textAnchor="middle" fontSize="8.5" fontWeight="700">
              {hex.label ?? hex.id}
            </text>
            <text x={x} y={y + 8} textAnchor="middle" fontSize="8.5">
              货:{goodsCount} 轨:{trackCount}
            </text>
            {isClickable ? (
              <circle cx={x + 19} cy={y - 18} r="4.5" fill={isSelected ? "#f4d06f" : "#ffffff"} stroke="#3b2f28" strokeWidth="1" />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
