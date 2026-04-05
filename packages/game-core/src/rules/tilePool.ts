/**
 * 功能概述：管理有限轨道库存的查询、扣减和归还。
 * 输入输出：输入 tile pool 与板块 id；输出新的 tile pool 或查询结果。
 * 处理流程：在不直接改原对象的前提下返回更新后的库存状态。
 */

import type { TilePoolState } from "../state/gameState";

export function hasTileAvailable(tilePool: TilePoolState, tileId: string) {
  return (tilePool.counts[tileId] ?? 0) > 0;
}

export function takeTile(tilePool: TilePoolState, tileId: string): TilePoolState {
  if (!hasTileAvailable(tilePool, tileId)) {
    throw new Error(`Tile ${tileId} is not available.`);
  }
  return {
    counts: {
      ...tilePool.counts,
      [tileId]: tilePool.counts[tileId] - 1,
    },
  };
}

export function returnTile(tilePool: TilePoolState, tileId: string): TilePoolState {
  return {
    counts: {
      ...tilePool.counts,
      [tileId]: (tilePool.counts[tileId] ?? 0) + 1,
    },
  };
}
