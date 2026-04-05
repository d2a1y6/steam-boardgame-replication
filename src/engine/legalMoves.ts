/**
 * 功能概述：把当前局面整理成更贴近真人交互的合法对象集合。
 * 输入输出：输入引擎会话和玩家 id；输出可选行动牌、建轨落点、运货源与公共区摘要。
 * 处理流程：统一调用规则函数做只读查询，避免 UI 自己重复理解规则。
 */

import { ACTION_TILE_DEFINITIONS } from "../data/setup/actionTiles";
import { TILE_MANIFEST } from "../data/tiles/manifest";
import { canPlaceTrack } from "../rules/trackPlacement";
import { getDeliveryCandidates } from "../rules/goodsDelivery";
import type { EngineSession } from "./types";
import { getWorkingState } from "./draftSession";
import { rankDeliveryCandidates } from "../rules/routeRanking";

export interface SelectableActionTileView {
  readonly tileId: string;
  readonly label: string;
  readonly value: number;
  readonly disabled: boolean;
  readonly selectedByPlayerId: string | null;
}

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

export interface TrackPlacementOptionView {
  readonly hexId: string;
  readonly rotation: number;
  readonly cost: number;
  readonly startsNewLink: boolean;
}

export interface GoodsSourceOptionView {
  readonly id: string;
  readonly sourceHexId: string;
  readonly goodsColor: string;
  readonly label: string;
  readonly candidateCount: number;
}

export interface TurnOrderEntryView {
  readonly playerId: string;
  readonly playerName: string;
  readonly selectedTileLabel: string | null;
  readonly isCurrent: boolean;
}

function playerNameById(session: EngineSession, playerId: string) {
  return getWorkingState(session).players.find((player) => player.id === playerId)?.name ?? playerId;
}

function currentPlayerId(session: EngineSession) {
  const state = getWorkingState(session);
  const order = state.turn.phase === "build-track" && state.turn.buildOrder.length > 0
    ? state.turn.buildOrder
    : state.turn.turnOrder;
  return order[state.turn.currentPlayerIndex] ?? null;
}

/**
 * 功能：列出当前仍可选择的行动牌。
 * 参数：`session` 是当前引擎会话。
 * 返回：带占用信息的行动牌列表。
 * 逻辑：把已被其他玩家拿走的牌标记出来，供 UI 决定禁用态。
 */
export function getSelectableActionTiles(session: EngineSession): SelectableActionTileView[] {
  const state = getWorkingState(session);
  return ACTION_TILE_DEFINITIONS.map((tile) => {
    const selectedByEntry = Object.entries(state.turn.selectedActionTiles).find(([, selected]) => selected === tile.id);
    return {
      tileId: tile.id,
      label: tile.label,
      value: tile.value,
      disabled: Boolean(selectedByEntry),
      selectedByPlayerId: selectedByEntry?.[0] ?? null,
    };
  });
}

/**
 * 功能：汇总当前轨道库存。
 * 参数：`session` 是当前引擎会话。
 * 返回：按 tile 类型整理的剩余数量摘要。
 * 逻辑：从 manifest 和 supply 中读取库存，不做任何状态改动。
 */
export function getTilePoolSummary(session: EngineSession): TilePoolSummaryView[] {
  const state = getWorkingState(session);
  return TILE_MANIFEST.map((tile) => ({
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
          player,
          tilePool: state.supply.tilePool,
          hexId: hex.id,
          tileId,
          rotation,
        }).ok
      ).some(Boolean))
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

/**
 * 功能：列出当前玩家可运输的货物源。
 * 参数：`session` 是引擎会话，`playerId` 是行动玩家。
 * 返回：按“城市 + 颜色”聚合的货物源列表。
 * 逻辑：先搜索候选运输方案，再只保留至少有一条合法候选的源。
 */
export function getMovableGoodsSources(session: EngineSession, playerId: string): GoodsSourceOptionView[] {
  const state = getWorkingState(session);
  const grouped = new Map<string, GoodsSourceOptionView>();

  for (const candidate of getDeliveryCandidates(state, playerId)) {
    const key = `${candidate.sourceHexId}:${candidate.goodsColor}`;
    const current = grouped.get(key);
    grouped.set(key, {
      id: key,
      sourceHexId: candidate.sourceHexId,
      goodsColor: candidate.goodsColor,
      label: `${candidate.sourceHexId} / ${candidate.goodsColor}`,
      candidateCount: (current?.candidateCount ?? 0) + 1,
    });
  }

  return [...grouped.values()].sort((left, right) => left.label.localeCompare(right.label));
}

/**
 * 功能：筛出某个货物源对应的候选运输方案。
 * 参数：`session` 是引擎会话，`playerId` 是行动玩家，`sourceHexId` 和 `goodsColor` 标识货物源。
 * 返回：排序后的少量候选方案。
 * 逻辑：先过滤同源同色候选，再复用排序函数裁剪数量。
 */
export function getRankedDeliveryCandidatesForSource(
  session: EngineSession,
  playerId: string,
  sourceHexId: string,
  goodsColor: string,
  limit = 3,
) {
  const state = getWorkingState(session);
  return rankDeliveryCandidates(
    getDeliveryCandidates(state, playerId).filter(
      (candidate) => candidate.sourceHexId === sourceHexId && candidate.goodsColor === goodsColor,
    ),
    limit,
  );
}

/**
 * 功能：整理当前顺位与行动牌占用信息。
 * 参数：`session` 是当前引擎会话。
 * 返回：适合面板展示的顺位列表。
 * 逻辑：按当前 turnOrder 顺序输出玩家、行动牌与当前行动标记。
 */
export function getTurnOrderEntries(session: EngineSession): TurnOrderEntryView[] {
  const state = getWorkingState(session);
  const nowPlayerId = currentPlayerId(session);

  return state.turn.turnOrder.map((playerId) => ({
    playerId,
    playerName: playerNameById(session, playerId),
    selectedTileLabel:
      ACTION_TILE_DEFINITIONS.find((tile) => tile.id === state.turn.selectedActionTiles[playerId])?.label ?? null,
    isCurrent: playerId === nowPlayerId,
  }));
}
