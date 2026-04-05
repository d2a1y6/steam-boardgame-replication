/**
 * 功能概述：定义游戏主状态树，作为规则引擎与界面的共享真相。
 * 输入输出：不直接处理输入；导出状态类型供 state、rules、engine、ui 共用。
 * 处理流程：拆分玩家、地图、供给、阶段、日志等结构，给第一阶段骨架提供稳定边界。
 */

import type {
  ActionTileId,
  GameContentCatalogs,
  GoodsColor,
  MapDefinition,
  RuleSet,
  TrackPointDestination,
} from "../contracts/domain";

export type PlayerColor =
  | "orange"
  | "green"
  | "natural"
  | "white"
  | "brown"
  | "black";

export type TurnPhase =
  | "buy-capital"
  | "auction-turn-order"
  | "select-action"
  | "build-track"
  | "move-goods-round-1"
  | "move-goods-round-2"
  | "resolve-delivery"
  | "income"
  | "determine-order"
  | "set-up-next-turn"
  | "finished";

export interface PlayerState {
  id: string;
  name: string;
  color: PlayerColor;
  cash: number;
  income: number;
  victoryPoints: number;
  locomotiveLevel: number;
  bankrupt: boolean;
  isBot: boolean;
}

export interface GameLogEntry {
  id: string;
  kind: "info" | "warning" | "action";
  message: string;
}

export interface SupplyGroup {
  id: string;
  cubes: GoodsColor[];
}

export interface TilePoolState {
  counts: Record<string, number>;
}

export interface TrackPieceState {
  id: string;
  hexId: string;
  tileId: string;
  ownerId: string;
  rotation: number;
  segmentOwners?: string[];
}

export interface SegmentEndpoint {
  hexId: string;
  edge: number | "town";
}

export interface TrackSegmentState {
  id: string;
  trackId: string;
  ownerId: string;
  endpoints: [SegmentEndpoint, SegmentEndpoint];
}

export interface TokenAnchorState {
  playerId: string;
  segmentId: string;
}

export interface LinkState {
  id: string;
  segmentIds: string[];
  ownerId: string | null;
  touchedStops: string[];
  complete: boolean;
}

export interface NewCityState {
  hexId: string;
  color: GoodsColor;
}

export interface PendingTrackPointChoice {
  playerId: string;
  points: number;
}

export interface PendingDeliveryResolution {
  candidate: DeliveryCandidate;
  queue: PendingTrackPointChoice[];
  resolvedChoices: Record<string, TrackPointDestination>;
  sourcePhase: "move-goods-round-1" | "move-goods-round-2";
}

export interface AuctionState {
  currentBid: number;
  leaderPlayerId: string | null;
  playerBids: Record<string, number>;
  passedPlayerIds: string[];
  finalOrder: string[];
  bonusPassPlayerId: string | null;
  bonusPassUsedByPlayer: Record<string, boolean>;
}

export interface MapRuntimeState {
  definition: MapDefinition;
  trackPieces: TrackPieceState[];
  segments: TrackSegmentState[];
  anchors: TokenAnchorState[];
  links: LinkState[];
  newCities: NewCityState[];
  cityGrowthMarkers: string[];
  cityGoods: Record<string, GoodsColor[]>;
}

export interface TurnState {
  round: number;
  finalRound: number;
  phase: TurnPhase;
  turnOrder: string[];
  currentPlayerIndex: number;
  buildOrder: string[];
  moveOrder?: string[];
  selectedActionTiles: Record<string, ActionTileId | null>;
  passedActionTiles?: Record<string, boolean>;
  pendingBuildActions?: Record<string, Extract<ActionTileId, "city-growth" | "urbanization"> | null>;
  buildAllowanceRemaining: number;
  moveActionsTaken: Record<string, number>;
  upgradedThisTurn: Record<string, boolean>;
  pendingDeliveryResolution?: PendingDeliveryResolution | null;
  auctionState?: AuctionState | null;
  capitalBoughtThisTurn?: Record<string, number>;
  bonusAuctionPassPlayerId?: string | null;
}

export interface SupplyState {
  goodsBag: GoodsColor[];
  goodsSupply: SupplyGroup[];
  tilePool: TilePoolState;
  newCityTiles: GoodsColor[];
}

export interface GameState {
  mode: RuleSet["mode"];
  ruleset: RuleSet;
  content: GameContentCatalogs;
  players: PlayerState[];
  map: MapRuntimeState;
  supply: SupplyState;
  turn: TurnState;
  logs: GameLogEntry[];
}

export interface DeliveryCandidate {
  id: string;
  playerId: string;
  sourceHexId: string;
  destinationHexId: string;
  goodsColor: GoodsColor;
  pathStopIds: string[];
  linkIds: string[];
  pointsByOwner: Record<string, number>;
  selfPoints: number;
}
