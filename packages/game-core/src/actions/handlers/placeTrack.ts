/**
 * 功能概述：处理建轨阶段的单步落子。
 * 输入输出：输入当前工作态与建轨动作；输出更新后的工作态。
 * 处理流程：校验额度与合法性、处理融资与库存、刷新线路所有权，再记录动作日志。
 */

import type { GameAction } from "../../state/actionTypes";
import type { GameState, TrackPieceState } from "../../state/gameState";
import { addAnchor } from "../../rules/tokenAnchors";
import { ensureCashForImmediateCost } from "../../rules/finance";
import { rebuildTrackOwnership } from "../../rules/trackOwnership";
import { canPlaceTrack } from "../../rules/trackPlacement";
import { takeTile } from "../../rules/tilePool";
import { appendLog, replacePlayer } from "./shared";

/**
 * 功能：在建轨草稿中落下一块轨道。
 * 参数：`state` 是当前草稿工作态，`action` 是本次建轨动作。
 * 返回：新的工作态。
 * 逻辑：先做建轨合法性与融资校验，再更新轨道、库存、玩家经济与 link 所有权。
 */
export function placeTrackInDraft(
  state: GameState,
  action: Extract<GameAction, { type: "place-track" }>,
): GameState {
  if (state.turn.buildAllowanceRemaining <= 0) {
    return appendLog(state, "warning", "当前玩家本阶段的建轨额度已经用完。");
  }

  const player = state.players.find((item) => item.id === action.playerId);
  if (!player) {
    return appendLog(state, "warning", "找不到建轨玩家。");
  }

  const placementCheck = canPlaceTrack({
    map: state.map,
    tileManifest: state.content.tileManifest,
    player,
    tilePool: state.supply.tilePool,
    hexId: action.hexId,
    tileId: action.tileId,
    rotation: action.rotation,
  });
  if (!placementCheck.ok || placementCheck.cost == null) {
    return appendLog(state, "warning", placementCheck.reason ?? "建轨失败。");
  }

  const paid = ensureCashForImmediateCost(player, placementCheck.cost, state.ruleset.canRaiseMoneyDuringTurn);
  if (!paid.ok) {
    return appendLog(state, "warning", paid.reason ?? "当前无法支付建轨费用。");
  }
  const replacedTrack = placementCheck.replacedTrackId
    ? state.map.trackPieces.find((track) => track.id === placementCheck.replacedTrackId) ?? null
    : null;
  const nextTrack: TrackPieceState = {
    id: replacedTrack?.id ?? `track-${state.map.trackPieces.length + 1}`,
    hexId: action.hexId,
    tileId: action.tileId,
    ownerId: replacedTrack?.ownerId ?? action.playerId,
    rotation: action.rotation,
    segmentOwners: placementCheck.nextSegmentOwners,
  };

  let nextState: GameState = replacePlayer(state, action.playerId, paid.player);
  nextState = {
    ...nextState,
    map: {
      ...nextState.map,
      trackPieces: replacedTrack
        ? [...nextState.map.trackPieces.filter((track) => track.id !== replacedTrack.id), nextTrack]
        : [...nextState.map.trackPieces, nextTrack],
    },
    supply: {
      ...nextState.supply,
      tilePool: replacedTrack
        ? {
            ...takeTile(nextState.supply.tilePool, action.tileId),
            counts: {
              ...takeTile(nextState.supply.tilePool, action.tileId).counts,
              [replacedTrack.tileId]: (nextState.supply.tilePool.counts[replacedTrack.tileId] ?? 0) + 1,
            },
          }
        : takeTile(nextState.supply.tilePool, action.tileId),
    },
    turn: {
      ...nextState.turn,
      buildAllowanceRemaining: Math.max(0, nextState.turn.buildAllowanceRemaining - 1),
    },
  };

  nextState = {
    ...nextState,
    map: rebuildTrackOwnership(nextState.map, nextState.content.tileManifest),
  };

  const anchorSegment =
    [...nextState.map.segments]
      .reverse()
      .find((segment) => segment.trackId === nextTrack.id && segment.ownerId === action.playerId)
    ?? null;
  if (placementCheck.startsNewLink && anchorSegment) {
    nextState = {
      ...nextState,
      map: rebuildTrackOwnership(
        {
          ...nextState.map,
          anchors: addAnchor(nextState.map.anchors, action.playerId, anchorSegment.id),
        },
        nextState.content.tileManifest,
      ),
    };
  }

  if (placementCheck.operation === "redirect" && replacedTrack) {
    const redirectedLink = nextState.map.links.find((link) => link.segmentIds.some((segmentId) => segmentId.startsWith(`${nextTrack.id}:`))) ?? null;
    if (redirectedLink && redirectedLink.complete && redirectedLink.ownerId == null && anchorSegment) {
      nextState = {
        ...nextState,
        map: rebuildTrackOwnership(
          {
            ...nextState.map,
            anchors: addAnchor(nextState.map.anchors, action.playerId, anchorSegment.id),
          },
          nextState.content.tileManifest,
        ),
      };
    }
  }

  return appendLog(
    nextState,
    "action",
    `${player.name} 在 ${action.hexId}${placementCheck.operation === "redirect" ? " 重定向" : placementCheck.operation === "improve" ? " 升级" : " 铺设"}了 ${action.tileId}，费用 ${placementCheck.cost}。`,
  );
}
