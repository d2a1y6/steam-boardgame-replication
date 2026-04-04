/**
 * 六边形地图、轨道板与运输路径的共享类型。
 * 输入主要来自地图定义、板块定义与运行时局面。
 * 输出给地图图构建、规则判定和路径搜索模块复用。
 */

export type GameMode = "base" | "standard";

export type GoodsColor = "red" | "blue" | "yellow" | "purple" | "gray";

export type PlayerColor =
  | "orange"
  | "green"
  | "natural"
  | "white"
  | "brown"
  | "black";

export type HexKind = "plain" | "hill" | "river" | "coast" | "city" | "town";

export type HexSide = 0 | 1 | 2 | 3 | 4 | 5;

export interface HexCoord {
  readonly q: number;
  readonly r: number;
}

export interface MapHex {
  readonly coord: HexCoord;
  readonly kind: HexKind;
  readonly cityColor?: GoodsColor;
  readonly cityName?: string;
  readonly townName?: string;
  readonly initialGoods?: number;
  readonly blockedSides?: readonly HexSide[];
}

export interface TrackTileShape {
  readonly id: string;
  readonly name: string;
  readonly exits: readonly HexSide[];
  readonly baseCost: number;
  readonly townOnly?: boolean;
  readonly isComplex?: boolean;
  readonly connections: readonly [HexSide, HexSide][];
}

export interface TrackPlacement {
  readonly placementId: string;
  readonly tileId: string;
  readonly coord: HexCoord;
  readonly rotation: number;
  readonly ownerId: string;
  readonly sourceAction?: string;
  readonly anchorSegmentId?: string | null;
}

export type GraphNodeKind = "hex-side" | "city" | "town";

export interface GraphNode {
  readonly id: string;
  readonly kind: GraphNodeKind;
  readonly coordKey: string;
  readonly side?: HexSide;
  readonly color?: GoodsColor;
  readonly name?: string;
}

export interface GraphEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly placementId: string;
  readonly tileId: string;
  readonly ownerId: string | null;
}

export interface SegmentGraph {
  readonly nodes: Record<string, GraphNode>;
  readonly edges: readonly GraphEdge[];
}

export interface LinkComponent {
  readonly id: string;
  readonly edgeIds: readonly string[];
  readonly nodeIds: readonly string[];
  readonly terminalNodeIds: readonly string[];
  readonly complete: boolean;
  readonly ownerCounts: Record<string, number>;
}

export interface LinkEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly componentId: string;
  readonly ownerCounts: Record<string, number>;
  readonly complete: boolean;
}

export interface LinkGraph {
  readonly nodes: Record<string, GraphNode>;
  readonly edges: readonly LinkEdge[];
  readonly components: readonly LinkComponent[];
}

export interface RouteCandidate {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly linkEdgeIds: readonly string[];
  readonly nodePath: readonly string[];
  readonly distance: number;
  readonly ownerUsage: Record<string, number>;
}

export interface RoutePreview {
  readonly candidates: readonly RouteCandidate[];
  readonly chosenCandidateId?: string | null;
}

