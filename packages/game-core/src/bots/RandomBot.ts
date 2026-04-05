/**
 * 功能概述：实现一个只会在合法动作里随机选择的最弱 Bot。
 * 输入输出：输入当前游戏状态与 Bot 玩家 id；输出一个下一步动作。
 * 处理流程：优先从当前阶段可执行的合法候选里随机抽一个，保证骨架能自动推进。
 */

import { getDeliveryCandidates } from "../rules/goodsDelivery";
import { canPlaceTrack } from "../rules/trackPlacement";
import type { GameAction } from "../state/actionTypes";
import type { GameState } from "../state/gameState";
import type { Bot } from "./Bot";

function pickRandom<T>(items: readonly T[], random: () => number): T | null {
  if (items.length === 0) {
    return null;
  }
  return items[Math.floor(random() * items.length)] ?? items[0] ?? null;
}

function buildTrackCandidates(game: GameState, playerId: string) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player) {
    return [];
  }

  const tileIds = game.content.tileManifest.filter((tile) => (game.supply.tilePool.counts[tile.id] ?? 0) > 0).map((tile) => tile.id);
  const candidates: GameAction[] = [];

  for (const tileId of tileIds) {
    for (const hex of game.map.definition.hexes) {
      const check = canPlaceTrack({
        map: game.map,
        tileManifest: game.content.tileManifest,
        player,
        tilePool: game.supply.tilePool,
        hexId: hex.id,
        tileId,
        rotation: 0,
      });
      if (check.ok) {
        candidates.push({
          type: "place-track",
          playerId,
          hexId: hex.id,
          tileId,
          rotation: 0,
        });
      }
    }
  }

  return candidates;
}

export class RandomBot implements Bot {
  constructor(private readonly random: () => number = Math.random) {}

  getMove(game: GameState, playerId: string): GameAction | null {
    switch (game.turn.phase) {
      case "buy-capital":
        return { type: "buy-capital", playerId, steps: 2 };
      case "auction-turn-order": {
        const auctionState = game.turn.auctionState;
        const player = game.players.find((item) => item.id === playerId);
        if (!auctionState || !player) {
          return { type: "pass-auction", playerId };
        }
        const minimumBid = Math.max(0, auctionState.currentBid + 1);
        if (minimumBid <= player.cash && this.random() > 0.4) {
          return { type: "place-auction-bid", playerId, bid: minimumBid };
        }
        return { type: "pass-auction", playerId };
      }
      case "select-action": {
        const taken = new Set(Object.values(game.turn.selectedActionTiles).filter(Boolean));
        const tile = pickRandom(
          game.content.actionTiles.filter((item) => !taken.has(item.id)),
          this.random,
        );
        return tile
          ? {
              type: "select-action-tile",
              playerId,
              tileId: tile.id,
              usePassOption: tile.hasPassOption ? this.random() > 0.7 : false,
            }
          : null;
      }
      case "build-track": {
        const pendingBuildAction = game.turn.pendingBuildActions?.[playerId] ?? null;
        if (pendingBuildAction === "city-growth") {
          const targetCity = game.map.definition.hexes.find(
            (hex) => hex.terrain === "city" && !game.map.cityGrowthMarkers.includes(hex.id),
          );
          const supplyGroup = game.supply.goodsSupply.find((group) => group.cubes.length > 0);
          return targetCity && supplyGroup
            ? { type: "perform-city-growth", playerId, cityHexId: targetCity.id, supplyGroupId: supplyGroup.id }
            : { type: "finish-build", playerId };
        }
        if (pendingBuildAction === "urbanization") {
          const targetTown = game.map.definition.hexes.find((hex) => hex.isTown);
          const newCityColor = game.supply.newCityTiles[0];
          const supplyGroup = game.supply.goodsSupply.find((group) => group.cubes.length > 0);
          return targetTown && newCityColor && supplyGroup
            ? {
                type: "perform-urbanization",
                playerId,
                townHexId: targetTown.id,
                newCityColor,
                supplyGroupId: supplyGroup.id,
              }
            : { type: "finish-build", playerId };
        }
        if (game.turn.buildAllowanceRemaining <= 0) {
          return { type: "finish-build", playerId };
        }
        const placement = pickRandom(buildTrackCandidates(game, playerId), this.random);
        return placement ?? { type: "finish-build", playerId };
      }
      case "resolve-delivery":
        return { type: "choose-track-points-destination", playerId, destination: this.random() > 0.5 ? "income" : "victory-points" };
      case "move-goods-round-1":
      case "move-goods-round-2": {
        const candidates = getDeliveryCandidates(game, playerId);
        const delivery = pickRandom(candidates, this.random);
        if (delivery) {
          return { type: "deliver-goods", playerId, candidateId: delivery.id };
        }
        if (!game.turn.upgradedThisTurn[playerId]) {
          return { type: "upgrade-locomotive", playerId };
        }
        return { type: "pass-move", playerId };
      }
      case "income":
        return { type: "resolve-income", playerId };
      case "determine-order":
        return { type: "advance-turn-order" };
      case "set-up-next-turn":
        return { type: "set-up-next-turn" };
      case "finished":
        return null;
    }
  }
}
