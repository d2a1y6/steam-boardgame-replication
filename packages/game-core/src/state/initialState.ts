/**
 * 功能概述：根据规则集、地图和玩家信息创建一局基础可运行状态。
 * 输入输出：输入玩家名、地图、模式与是否 Bot；输出完整 GameState。
 * 处理流程：初始化玩家、货物、供给、tile pool、回合顺序和城市货物。
 */

import type { GameContentCatalogs, GoodsColor, MapDefinition, RuleSet } from "../contracts/domain";
import type { GameState, PlayerColor, PlayerState, SupplyGroup } from "./gameState";

const PLAYER_COLORS: PlayerColor[] = ["orange", "green", "natural", "white", "brown", "black"];
const GOODS_ORDER: GoodsColor[] = ["red", "blue", "yellow", "purple", "gray"];

function createGoodsBag(content: GameContentCatalogs): GoodsColor[] {
  const bag: GoodsColor[] = [];
  for (const color of GOODS_ORDER) {
    for (let index = 0; index < content.goodsBagComposition[color]; index += 1) {
      bag.push(color);
    }
  }
  return bag;
}

function buildSupplyGroups(content: GameContentCatalogs): SupplyGroup[] {
  return Array.from({ length: content.goodsSupplySpaceCount }, (_, index) => ({
    id: `supply-${index + 1}`,
    cubes: GOODS_ORDER.slice(index % GOODS_ORDER.length, (index % GOODS_ORDER.length) + content.goodsSupplyCubesPerSpace).concat(
      GOODS_ORDER,
    ).slice(0, content.goodsSupplyCubesPerSpace),
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

function buildTilePool(content: GameContentCatalogs) {
  return {
    counts: Object.fromEntries(content.tileManifest.map((tile) => [tile.id, tile.count])),
  };
}

export function createInitialState(options: {
  playerNames: string[];
  botPlayerIds?: string[];
  map: MapDefinition;
  ruleset: RuleSet;
  content: GameContentCatalogs;
}): GameState {
  const players = buildPlayers(options.playerNames, new Set(options.botPlayerIds ?? []));

  return {
    mode: options.ruleset.mode,
    ruleset: options.ruleset,
    content: options.content,
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
      goodsBag: createGoodsBag(options.content),
      goodsSupply: buildSupplyGroups(options.content),
      tilePool: buildTilePool(options.content),
      newCityTiles: [...options.content.newCityTiles],
    },
    turn: {
      round: 1,
      finalRound: options.ruleset.turnsByPlayerCount[players.length] ?? 10,
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
        message: `已创建基础局：${players.length} 名玩家，${options.content.actionTiles.length} 张行动牌。`,
      },
    ],
  };
}
