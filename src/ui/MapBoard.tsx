/**
 * 功能概述：用最简 SVG 展示地图 hex、轨道与城市货物数量。
 * 输入输出：输入当前游戏状态；输出可视化棋盘。
 * 处理流程：按 axial 坐标粗略布局 hex，并叠加轨道和标签。
 */

import type { GameState } from "../state/gameState";

function hexPoint(cx: number, cy: number, radius: number, index: number) {
  const angle = (Math.PI / 180) * (60 * index - 30);
  return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
}

export function MapBoard({ game }: { game: GameState }) {
  const radius = 31;
  const width = 560;
  const height = 350;

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

        return (
          <g key={hex.id}>
            <polygon points={points} fill={fill} stroke="#3b2f28" strokeWidth="2" />
            <text x={x} y={y - 5} textAnchor="middle" fontSize="8.5" fontWeight="700">
              {hex.label ?? hex.id}
            </text>
            <text x={x} y={y + 8} textAnchor="middle" fontSize="8.5">
              货:{goodsCount} 轨:{trackCount}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
