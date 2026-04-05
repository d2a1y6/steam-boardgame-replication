/**
 * 功能概述：处理 City Growth 与 Urbanization 的正式执行。
 * 输入输出：输入当前正式状态和动作；输出更新后的正式状态。
 * 处理流程：校验待执行行动、扣减 Goods Supply / New City tile，并刷新地图与线路所有权。
 */

import type { GameAction } from "../../state/actionTypes";
import type { GameState, SupplyGroup } from "../../state/gameState";
import { rebuildTrackOwnership } from "../../rules/trackOwnership";
import { appendLog } from "./shared";

function takeSupplyGroup(groups: readonly SupplyGroup[], groupId: string) {
  const group = groups.find((item) => item.id === groupId) ?? null;
  return {
    group,
    groups: groups.filter((item) => item.id !== groupId),
  };
}

function ensurePendingAction(
  state: GameState,
  playerId: string,
  expectedAction: "city-growth" | "urbanization",
) {
  return (state.turn.pendingBuildActions?.[playerId] ?? null) === expectedAction;
}

export function performCityGrowth(
  state: GameState,
  action: Extract<GameAction, { type: "perform-city-growth" }>,
): GameState {
  if (!ensurePendingAction(state, action.playerId, "city-growth")) {
    return appendLog(state, "warning", "当前没有待执行的 City Growth。");
  }

  const cityHex = state.map.definition.hexes.find((hex) => hex.id === action.cityHexId);
  if (!cityHex || cityHex.terrain !== "city") {
    return appendLog(state, "warning", "City Growth 必须作用于现有城市。");
  }
  if (state.map.cityGrowthMarkers.includes(action.cityHexId)) {
    return appendLog(state, "warning", "该城市已经有 City Growth marker。");
  }

  const { group, groups } = takeSupplyGroup(state.supply.goodsSupply, action.supplyGroupId);
  if (!group || group.cubes.length === 0) {
    return appendLog(state, "warning", "选定的 Goods Supply 组不存在或已空。");
  }

  return appendLog(
    {
      ...state,
      map: {
        ...state.map,
        cityGrowthMarkers: [...state.map.cityGrowthMarkers, action.cityHexId],
        cityGoods: {
          ...state.map.cityGoods,
          [action.cityHexId]: [...(state.map.cityGoods[action.cityHexId] ?? []), ...group.cubes],
        },
      },
      supply: {
        ...state.supply,
        goodsSupply: groups,
      },
      turn: {
        ...state.turn,
        pendingBuildActions: {
          ...(state.turn.pendingBuildActions ?? {}),
          [action.playerId]: null,
        },
      },
    },
    "action",
    `${action.playerId} 对 ${action.cityHexId} 执行了 City Growth。`,
  );
}

export function performUrbanization(
  state: GameState,
  action: Extract<GameAction, { type: "perform-urbanization" }>,
): GameState {
  if (!ensurePendingAction(state, action.playerId, "urbanization")) {
    return appendLog(state, "warning", "当前没有待执行的 Urbanization。");
  }

  const townHex = state.map.definition.hexes.find((hex) => hex.id === action.townHexId);
  if (!townHex || !townHex.isTown) {
    return appendLog(state, "warning", "Urbanization 必须作用于一个 town hex。");
  }
  if (!state.supply.newCityTiles.includes(action.newCityColor as never)) {
    return appendLog(state, "warning", "选定的新城市板颜色不存在。");
  }

  const { group, groups } = takeSupplyGroup(state.supply.goodsSupply, action.supplyGroupId);
  if (!group || group.cubes.length === 0) {
    return appendLog(state, "warning", "选定的 Goods Supply 组不存在或已空。");
  }

  const removedTrack = state.map.trackPieces.find((track) => track.hexId === action.townHexId) ?? null;
  const nextTrackPieces = state.map.trackPieces.filter((track) => track.hexId !== action.townHexId);
  const nextTilePool = removedTrack
    ? {
        ...state.supply.tilePool,
        counts: {
          ...state.supply.tilePool.counts,
          [removedTrack.tileId]: (state.supply.tilePool.counts[removedTrack.tileId] ?? 0) + 1,
        },
      }
    : state.supply.tilePool;

  const nextDefinition = {
    ...state.map.definition,
    hexes: state.map.definition.hexes.map((hex) =>
      hex.id === action.townHexId
        ? {
            ...hex,
            terrain: "city" as const,
            isTown: false,
            cityColor: action.newCityColor as never,
            cityDemand: 0,
          }
        : hex,
    ),
  };

  const rebuiltMap = rebuildTrackOwnership(
    {
      ...state.map,
      definition: nextDefinition,
      trackPieces: nextTrackPieces,
      newCities: [...state.map.newCities, { hexId: action.townHexId, color: action.newCityColor as never }],
      cityGrowthMarkers: [...state.map.cityGrowthMarkers, action.townHexId],
      cityGoods: {
        ...state.map.cityGoods,
        [action.townHexId]: [...group.cubes],
      },
    },
    state.content.tileManifest,
  );
  let removed = false;
  const nextNewCityTiles = state.supply.newCityTiles.filter((color) => {
    if (!removed && color === action.newCityColor) {
      removed = true;
      return false;
    }
    return true;
  });

  return appendLog(
    {
      ...state,
      map: rebuiltMap,
      supply: {
        ...state.supply,
        goodsSupply: groups,
        tilePool: nextTilePool,
        newCityTiles: nextNewCityTiles,
      },
      turn: {
        ...state.turn,
        pendingBuildActions: {
          ...(state.turn.pendingBuildActions ?? {}),
          [action.playerId]: null,
        },
      },
    },
    "action",
    `${action.playerId} 在 ${action.townHexId} 执行了 Urbanization。`,
  );
}
