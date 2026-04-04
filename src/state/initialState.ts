/**
 * 功能概述：根据规则集、地图和玩家信息创建一局基础可运行状态。
 * 输入输出：输入玩家名、地图、模式与是否 Bot；输出完整 GameState。
 * 处理流程：初始化玩家、货物、供给、tile pool、回合顺序和城市货物。
 */

import { ACTION_TILE_DEFINITIONS } from "../data/setup/actionTiles";
import { GOODS_BAG_COMPOSITION, GOODS_SUPPLY_CUBES_PER_SPACE, GOODS_SUPPLY_SPACE_COUNT, type GoodsColor } from "../data/setup/goods";
import { NEW_CITY_TILE_COLORS } from "../data/setup/newCities";
import type { MapDefinition } from "../data/maps/ne_usa_se_canada";
import { TILE_MANIFEST } from "../data/tiles/manifest";
import { baseRuleSet, type RuleSet } from "../rulesets/base";
import type { GameState, PlayerColor, PlayerState, SupplyGroup } from "./gameState";

const PLAYER_COLORS: PlayerColor[] = ["orange", "green", "natural", "white", "brown", "black"];
const GOODS_ORDER: GoodsColor[] = ["red", "blue", "yellow", "purple", "gray"];

function createGoodsBag(): GoodsColor[] {
  const bag: GoodsColor[] = [];
  for (const color of GOODS_ORDER) {
    for (let index = 0; index < GOODS_BAG_COMPOSITION[color]; index += 1) {
      bag.push(color);
    }
  }
  return bag;
}

function buildSupplyGroups(): SupplyGroup[] {
  return Array.from({ length: GOODS_SUPPLY_SPACE_COUNT }, (_, index) => ({
    id: `supply-${index + 1}`,
    cubes: GOODS_ORDER.slice(index % GOODS_ORDER.length, (index % GOODS_ORDER.length) + GOODS_SUPPLY_CUBES_PER_SPACE).concat(
      GOODS_ORDER,
    ).slice(0, GOODS_SUPPLY_CUBES_PER_SPACE),
  }));
}

function buildPlayers(playerNames: string[], botPlayerIds: Set<string>): PlayerState[] {
  return playerNames.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    color: PLAYER_COLORS[index],
    cash: index,
    income: 0,
    victoryPoints: 0,
    locomotiveLevel: 1,
    bankrupt: false,
    isBot: botPlayerIds.has(`player-${index + 1}`),
  }));
}

function buildCityGoods(map: MapDefinition): Record<string, GoodsColor[]> {
  return Object.fromEntries(
    map.hexes
      .filter((hex) => hex.cityColor && hex.cityDemand)
      .map((hex) => [hex.id, Array.from({ length: hex.cityDemand ?? 0 }, () => hex.cityColor!)])
  );
}

function buildTilePool() {
  return {
    counts: Object.fromEntries(TILE_MANIFEST.map((tile) => [tile.id, tile.count])),
  };
}

export function createInitialState(options: {
  playerNames: string[];
  botPlayerIds?: string[];
  map: MapDefinition;
  ruleset?: RuleSet;
}): GameState {
  const ruleset = options.ruleset ?? baseRuleSet;
  const players = buildPlayers(options.playerNames, new Set(options.botPlayerIds ?? []));

  return {
    mode: ruleset.mode,
    ruleset,
    players,
    map: {
      definition: options.map,
      trackPieces: [],
      segments: [],
      anchors: [],
      links: [],
      newCities: [],
      cityGrowthMarkers: [],
      cityGoods: buildCityGoods(options.map),
    },
    supply: {
      goodsBag: createGoodsBag(),
      goodsSupply: buildSupplyGroups(),
      tilePool: buildTilePool(),
      newCityTiles: [...NEW_CITY_TILE_COLORS],
    },
    turn: {
      round: 1,
      finalRound: ruleset.turnsByPlayerCount[players.length] ?? 10,
      phase: "select-action",
      turnOrder: players.map((player) => player.id),
      currentPlayerIndex: 0,
      buildOrder: players.map((player) => player.id),
      selectedActionTiles: Object.fromEntries(players.map((player) => [player.id, null])),
      buildAllowanceRemaining: 3,
      moveActionsTaken: Object.fromEntries(players.map((player) => [player.id, 0])),
      upgradedThisTurn: Object.fromEntries(players.map((player) => [player.id, false])),
    },
    logs: [
      {
        id: "log-init",
        kind: "info",
        message: `已创建基础局：${players.length} 名玩家，${ACTION_TILE_DEFINITIONS.length} 张行动牌。`,
      },
    ],
  };
}
