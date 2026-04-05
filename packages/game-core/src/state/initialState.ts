/**
 * 功能概述：根据规则集、地图和玩家信息创建一局可运行的初始局面。
 * 输入输出：输入玩家名、地图、模式、seed 与是否 Bot；输出完整 GameState。
 * 处理流程：先生成可复现随机源，再抽取城市货物与 Goods Supply，最后初始化顺位、现金与阶段状态。
 */

import type { GameContentCatalogs, GoodsColor, MapDefinition, RuleSet } from "../contracts/domain";
import type { GameState, PlayerColor, PlayerState, SupplyGroup } from "./gameState";
import { createSeededRandom, shuffleArray } from "../utils";

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

function drawCubesFromBag(bag: GoodsColor[], count: number, random: () => number): GoodsColor[] {
  const cubes: GoodsColor[] = [];

  for (let index = 0; index < count && bag.length > 0; index += 1) {
    const bagIndex = Math.floor(random() * bag.length);
    const [cube] = bag.splice(bagIndex, 1);
    if (cube) {
      cubes.push(cube);
    }
  }

  return cubes;
}

function buildPlayers(playerNames: string[], botPlayerIds: Set<string>): PlayerState[] {
  return playerNames.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    color: PLAYER_COLORS[index],
    cash: 0,
    income: 0,
    victoryPoints: 0,
    locomotiveLevel: 1,
    bankrupt: false,
    isBot: botPlayerIds.has(`player-${index + 1}`),
  }));
}

function buildInitialTurnOrder(players: readonly PlayerState[], random: (() => number) | null) {
  const playerIds = players.map((player) => player.id);
  return random ? shuffleArray(playerIds, random) : playerIds;
}

function buildSupplyGroups(
  content: GameContentCatalogs,
  playerCount: number,
  bag: GoodsColor[],
  random: () => number,
): SupplyGroup[] {
  const cubesPerSpace = Math.max(0, content.goodsSupplyCubesPerSpace - (playerCount === 3 ? 1 : 0));
  return Array.from({ length: content.goodsSupplySpaceCount }, (_, index) => ({
    id: `supply-${index + 1}`,
    cubes: drawCubesFromBag(bag, cubesPerSpace, random),
  }));
}

function buildCityGoods(
  map: MapDefinition,
  playerCount: number,
  bag: GoodsColor[],
  random: () => number,
): Record<string, GoodsColor[]> {
  const ruhrThreePlayerModifier = map.id === "ruhr" && playerCount === 3 ? 1 : 0;
  return Object.fromEntries(
    map.hexes
      .filter((hex) => hex.cityColor && hex.cityDemand)
      .map((hex) => {
        const demand = Math.max(0, (hex.cityDemand ?? 0) - ruhrThreePlayerModifier);
        return [hex.id, drawCubesFromBag(bag, demand, random)];
      }),
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
  seed?: number;
}): GameState {
  const random = options.seed == null ? null : createSeededRandom(options.seed);
  const bag = createGoodsBag(options.content);
  const players = buildPlayers(options.playerNames, new Set(options.botPlayerIds ?? []));
  const turnOrder = buildInitialTurnOrder(players, random);
  const playersWithCash = players.map((player) => ({
    ...player,
    cash:
      options.ruleset.mode === "base"
        ? Math.max(0, turnOrder.findIndex((playerId) => playerId === player.id))
        : 0,
  }));
  const cityGoods = buildCityGoods(options.map, players.length, bag, random ?? (() => 0));
  const goodsSupply = buildSupplyGroups(options.content, players.length, bag, random ?? (() => 0));
  const startingPhase = options.ruleset.mode === "standard" ? "buy-capital" : "select-action";

  return {
    mode: options.ruleset.mode,
    ruleset: options.ruleset,
    content: options.content,
    players: playersWithCash,
    map: {
      definition: options.map,
      trackPieces: [],
      segments: [],
      anchors: [],
      links: [],
      newCities: [],
      cityGrowthMarkers: [],
      cityGoods,
    },
    supply: {
      goodsBag: bag,
      goodsSupply,
      tilePool: buildTilePool(options.content),
      newCityTiles: [...options.content.newCityTiles],
    },
    turn: {
      round: 1,
      finalRound: options.ruleset.turnsByPlayerCount[playersWithCash.length] ?? 10,
      phase: startingPhase,
      turnOrder,
      currentPlayerIndex: 0,
      buildOrder: turnOrder,
      moveOrder: turnOrder,
      selectedActionTiles: Object.fromEntries(playersWithCash.map((player) => [player.id, null])),
      passedActionTiles: Object.fromEntries(playersWithCash.map((player) => [player.id, false])),
      pendingBuildActions: Object.fromEntries(playersWithCash.map((player) => [player.id, null])),
      buildAllowanceRemaining: 3,
      moveActionsTaken: Object.fromEntries(playersWithCash.map((player) => [player.id, 0])),
      upgradedThisTurn: Object.fromEntries(playersWithCash.map((player) => [player.id, false])),
      pendingDeliveryResolution: null,
      auctionState: null,
      capitalBoughtThisTurn: Object.fromEntries(playersWithCash.map((player) => [player.id, 0])),
    },
    logs: [
      {
        id: "log-init",
        kind: "info",
        message: `已创建${options.ruleset.mode === "standard" ? "标准版" : "基础版"}对局：${playersWithCash.length} 名玩家，${options.content.actionTiles.length} 张行动牌。`,
      },
    ],
  };
}
