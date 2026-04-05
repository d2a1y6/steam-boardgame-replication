/**
 * 功能概述：提供六边形棋盘的几何计算与视口测量。
 * 输入输出：输入六边形中心点和半径，输出 SVG 多边形点串与整体包围盒。
 * 处理流程：统一处理六边形的顶点顺序，供 MapBoard 和后续轨道层复用。
 */

import type { HexCellView } from "../../shared/presentation/viewTypes";

export interface HexBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function hexPoints(x: number, y: number, radius: number): string {
  const points: string[] = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = ((60 * index - 30) * Math.PI) / 180;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(' ');
}

export function measureHexBoard(hexes: readonly HexCellView[], padding = 32): HexBounds {
  if (hexes.length === 0) {
    return { x: 0, y: 0, width: 320, height: 240 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const hex of hexes) {
    const radius = hex.radius ?? 42;
    minX = Math.min(minX, hex.x - radius);
    minY = Math.min(minY, hex.y - radius);
    maxX = Math.max(maxX, hex.x + radius);
    maxY = Math.max(maxY, hex.y + radius);
  }

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}
