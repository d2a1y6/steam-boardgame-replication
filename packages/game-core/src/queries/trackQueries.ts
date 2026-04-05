/**
 * 功能概述：整理建轨阶段的合法 hex 与朝向查询。
 * 输入输出：输入引擎会话、玩家和当前预选建轨板；输出可点击 hex 与合法朝向列表。
 * 处理流程：统一调用建轨规则函数，避免 UI 自己遍历地图和旋转。
 */

import type { EngineSession } from "../contracts/engine";
import { getWorkingState } from "../actions/draftSession";
import { canPlaceTrack } from "../rules/trackPlacement";

export interface TrackPlacementOptionView {
  readonly hexId: string;
  readonly rotation: number;
  readonly cost: number;
  readonly startsNewLink: boolean;
}

/**
 * 功能：找出某种轨道板当前可以点击的 hex。
 * 参数：`session` 是引擎会话，`playerId` 是行动玩家，`tileId` 是待铺设的轨道板。
 * 返回：至少存在一种合法 rotation 的 hex id 列表。
 * 逻辑：遍历地图与 6 个朝向，只保留真正可落子的格子。
 */
export function getBuildableHexIds(session: EngineSession, playerId: string, tileId: string): string[] {
  const state = getWorkingState(session);
  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    return [];
  }

  return state.map.definition.hexes
    .filter((hex) =>
      Array.from({ length: 6 }, (_, rotation) =>
        canPlaceTrack({
          map: state.map,
          tileManifest: state.content.tileManifest,
          player,
          tilePool: state.supply.tilePool,
          hexId: hex.id,
          tileId,
          rotation,
        }).ok,
      ).some(Boolean),
    )
    .map((hex) => hex.id);
}

/**
 * 功能：给定轨道板和 hex，列出所有合法朝向。
 * 参数：`session` 是引擎会话，`playerId` 是行动玩家，`tileId` 和 `hexId` 是当前预选内容。
 * 返回：每个合法朝向对应的费用与新 link 提示。
 * 逻辑：把规则层的逐朝向判定整理成 UI 可直接渲染的列表。
 */
export function getTrackPlacementOptions(
  session: EngineSession,
  playerId: string,
  tileId: string,
  hexId: string,
): TrackPlacementOptionView[] {
  const state = getWorkingState(session);
  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    return [];
  }

  return Array.from({ length: 6 }, (_, rotation) => {
    const check = canPlaceTrack({
      map: state.map,
      tileManifest: state.content.tileManifest,
      player,
      tilePool: state.supply.tilePool,
      hexId,
      tileId,
      rotation,
    });
    if (!check.ok || check.cost == null) {
      return null;
    }
    return {
      hexId,
      rotation,
      cost: check.cost,
      startsNewLink: Boolean(check.startsNewLink),
    };
  }).filter((item): item is TrackPlacementOptionView => item != null);
}
