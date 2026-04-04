/**
 * 功能概述：提供六边形坐标与边方向计算。
 * 输入输出：输入 axial 坐标或边索引；输出邻接坐标、对边编号等基础结果。
 * 处理流程：集中定义六方向向量，避免规则层散落魔法数字。
 */

export const HEX_DIRECTIONS: Array<[number, number]> = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

export function neighborCoordinate(q: number, r: number, edge: number) {
  const [dq, dr] = HEX_DIRECTIONS[((edge % 6) + 6) % 6];
  return { q: q + dq, r: r + dr };
}

export function oppositeEdge(edge: number) {
  return (((edge % 6) + 6) % 6 + 3) % 6;
}

export function axialKey(q: number, r: number) {
  return `${q},${r}`;
}
