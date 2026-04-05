/**
 * 功能概述：集中定义跨包共享的核心契约类型，避免内容层和规则层各自维护平行类型。
 * 输入输出：不接收运行时输入；导出地图、规则集、行动牌、tile 与存档原因等公共类型。
 * 处理流程：把会跨 `game-core`、`game-content`、`apps/web` 传播的领域类型放到同一处。
 */

export type GameMode = "base" | "standard";

export type GoodsColor = "red" | "blue" | "yellow" | "purple" | "gray";

export type ActionTileId =
  | "turn-order"
  | "first-move"
  | "engineer"
  | "first-build"
  | "city-growth"
  | "locomotive"
  | "urbanization";

export interface ActionTileDefinition {
  readonly id: ActionTileId;
  readonly value: number;
  readonly label: string;
  readonly hasPassOption: boolean;
}

export interface TileManifestEntry {
  readonly id: string;
  readonly exits: readonly [number, number][];
  readonly count: number;
  readonly isTownTile: boolean;
  readonly baseCost: number;
}

export interface GameContentCatalogs {
  readonly actionTiles: readonly ActionTileDefinition[];
  readonly tileManifest: readonly TileManifestEntry[];
  readonly goodsBagComposition: Record<GoodsColor, number>;
  readonly goodsSupplySpaceCount: number;
  readonly goodsSupplyCubesPerSpace: number;
  readonly newCityTiles: readonly GoodsColor[];
}

export type TerrainType = "plains" | "hills" | "city";

export interface MapHexDefinition {
  readonly id: string;
  readonly q: number;
  readonly r: number;
  readonly terrain: TerrainType;
  readonly hasRiver?: boolean;
  readonly blockedEdges?: readonly number[];
  readonly cityColor?: GoodsColor;
  readonly cityDemand?: number;
  readonly isTown?: boolean;
  readonly label?: string;
}

export interface MapDefinition {
  readonly id: string;
  readonly name: string;
  readonly hexes: readonly MapHexDefinition[];
}

export interface ActionCostTable {
  readonly cityGrowth: number;
  readonly locomotiveBase: number;
  readonly urbanization: number;
}

export interface RuleSet {
  readonly mode: GameMode;
  readonly phaseOrder: readonly string[];
  readonly turnsByPlayerCount: Record<number, number>;
  readonly canRaiseMoneyDuringTurn: boolean;
  readonly actionCosts: ActionCostTable;
}

export type RuleReasonContextValue =
  | string
  | number
  | boolean
  | null
  | readonly string[]
  | readonly number[];

export interface RuleReason {
  readonly code: string;
  readonly context?: Record<string, RuleReasonContextValue>;
}
