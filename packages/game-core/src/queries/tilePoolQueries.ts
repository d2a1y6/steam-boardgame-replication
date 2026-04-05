/**
 * 功能概述：整理轨道库存与建轨板选择相关的只读查询。
 * 输入输出：输入引擎会话；输出 tile pool 摘要和建轨面板选项。
 * 处理流程：从 manifest 和 supply 中读取库存，再补上展示层需要的标签与禁用态。
 */

import type { EngineSession } from "../contracts/engine";
import { getWorkingState } from "../actions/draftSession";

export interface TilePoolSummaryView {
  readonly tileId: string;
  readonly count: number;
  readonly isTownTile: boolean;
  readonly baseCost: number;
}

export interface TrackPaletteOptionView {
  readonly tileId: string;
  readonly label: string;
  readonly count: number;
  readonly isTownTile: boolean;
  readonly baseCost: number;
  readonly disabled: boolean;
}

/**
 * 功能：汇总当前轨道库存。
 * 参数：`session` 是当前引擎会话。
 * 返回：按 tile 类型整理的剩余数量摘要。
 * 逻辑：从 manifest 和 supply 中读取库存，不做任何状态改动。
 */
export function getTilePoolSummary(session: EngineSession): TilePoolSummaryView[] {
  const state = getWorkingState(session);
  return state.content.tileManifest.map((tile) => ({
    tileId: tile.id,
    count: state.supply.tilePool.counts[tile.id] ?? 0,
    isTownTile: tile.isTownTile,
    baseCost: tile.baseCost,
  }));
}

/**
 * 功能：列出建轨阶段当前可选择的轨道板。
 * 参数：`session` 是当前引擎会话。
 * 返回：按库存与类型整理的建轨板选项。
 * 逻辑：库存为零时直接禁用，让 UI 不必再手写判断。
 */
export function getTrackPaletteOptions(session: EngineSession): TrackPaletteOptionView[] {
  return getTilePoolSummary(session).map((tile) => ({
    tileId: tile.tileId,
    label: tile.isTownTile ? `${tile.tileId} 号城镇板` : `${tile.tileId} 号轨道板`,
    count: tile.count,
    isTownTile: tile.isTownTile,
    baseCost: tile.baseCost,
    disabled: tile.count <= 0,
  }));
}
