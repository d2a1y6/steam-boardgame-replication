/**
 * 功能概述：为第一部分测试提供轻量的规则合同辅助函数。
 * 输入输出：接收简化的局面描述，输出可断言的结算、校验和路径结果。
 * 处理流程：把第一部分需要锁定的规则边界先做成纯函数，便于后续替换成正式引擎实现。
 */

export interface FinanceInput {
  cashOnHand: number;
  expense: number;
  incomeLevel: number;
  victoryPoints: number;
}

export interface FinanceResult {
  cashOnHand: number;
  incomeLevel: number;
  victoryPoints: number;
  raised: number;
  bankrupt: boolean;
}

export function settleBaseExpense(input: FinanceInput): FinanceResult {
  const immediateCash = Math.min(input.cashOnHand, input.expense);
  const shortfall = Math.max(0, input.expense - immediateCash);
  const raised = Math.ceil(shortfall / 5) * 5;
  const raisedChunks = raised / 5;
  const incomeFloorMoves = Math.max(0, input.incomeLevel + 10);
  const incomeMoves = Math.min(raisedChunks, incomeFloorMoves);
  const incomeLevel = input.incomeLevel - incomeMoves;
  const vpLossChunks = Math.max(0, raisedChunks - incomeMoves);
  const victoryPoints = input.victoryPoints - vpLossChunks * 2;

  return {
    cashOnHand: input.cashOnHand - immediateCash + (raised - shortfall),
    incomeLevel: incomeLevel < -10 ? -10 : incomeLevel,
    victoryPoints,
    raised,
    bankrupt: victoryPoints < 0,
  };
}

export interface TilePool {
  [tileId: string]: number;
}

export interface TilePoolResult {
  ok: boolean;
  pool: TilePool;
  reason?: string;
}

export function consumeTile(pool: TilePool, tileId: string): TilePoolResult {
  const current = pool[tileId] ?? 0;
  if (current <= 0) {
    return { ok: false, pool: { ...pool }, reason: 'tile exhausted' };
  }

  return {
    ok: true,
    pool: { ...pool, [tileId]: current - 1 },
  };
}

export interface TrackPlacementCase {
  hasTile: boolean;
  placementKind: 'new' | 'redirect' | 'improve';
  originType: 'city' | 'town' | 'plain';
  targetType: 'city' | 'town' | 'plain';
  connectsToOwnNetwork: boolean;
  crossesBlackEdge: boolean;
  usesTownTile: boolean;
  preservesExistingTrack: boolean;
}

export interface TrackPlacementResult {
  ok: boolean;
  reason?: string;
}

export function validateTrackPlacement(input: TrackPlacementCase): TrackPlacementResult {
  if (!input.hasTile) {
    return { ok: false, reason: 'no tile left in pool' };
  }

  if (input.crossesBlackEdge) {
    return { ok: false, reason: 'crosses impassable edge' };
  }

  if (!input.connectsToOwnNetwork && input.originType !== 'city') {
    return { ok: false, reason: 'must connect to an owned city or track' };
  }

  if (input.targetType === 'city' && input.placementKind === 'new' && input.originType !== 'city') {
    return { ok: false, reason: 'first build must emerge from a city' };
  }

  if (input.targetType === 'town' && !input.usesTownTile) {
    return { ok: false, reason: 'town hex requires town tile' };
  }

  if (input.placementKind !== 'new' && !input.preservesExistingTrack) {
    return { ok: false, reason: 'improvement must preserve existing track' };
  }

  return { ok: true };
}

export interface SegmentAnchor {
  tokenId: string;
  ownerId: string;
  segmentIndex: number;
}

export interface ReanchoredToken {
  tokenId: string;
  ownerId: string;
  side: 'left' | 'right';
  segmentIndex: number;
}

export function splitAnchorsByBreakPoint(anchors: readonly SegmentAnchor[], breakIndex: number): ReanchoredToken[] {
  return anchors.map((anchor) => ({
    tokenId: anchor.tokenId,
    ownerId: anchor.ownerId,
    segmentIndex: anchor.segmentIndex,
    side: anchor.segmentIndex <= breakIndex ? 'left' : 'right',
  }));
}

export interface DeliveryCity {
  name: string;
  color: string;
}

export interface DeliverySegment {
  ownerId: string | null;
}

export interface DeliveryInput {
  playerId: string;
  cubeColor: string;
  locomotiveLevel: number;
  cities: DeliveryCity[];
  path: DeliverySegment[];
}

export interface DeliveryResult {
  legal: boolean;
  reason?: string;
  firstMatchingCityIndex?: number;
  trackPointsByPlayer: Record<string, number>;
}

export function evaluateDelivery(input: DeliveryInput): DeliveryResult {
  if (input.path.length > input.locomotiveLevel) {
    return { legal: false, reason: 'path exceeds locomotive level', trackPointsByPlayer: {} };
  }

  const playerUsage = input.path.filter((segment) => segment.ownerId === input.playerId).length;
  const opponentUsage = new Map<string, number>();

  for (const segment of input.path) {
    if (!segment.ownerId || segment.ownerId === input.playerId) {
      continue;
    }
    opponentUsage.set(segment.ownerId, (opponentUsage.get(segment.ownerId) ?? 0) + 1);
  }

  if (playerUsage === 0) {
    return { legal: false, reason: 'must use at least one owned segment', trackPointsByPlayer: {} };
  }

  const maxOpponentUsage = Math.max(0, ...opponentUsage.values());
  if (playerUsage < maxOpponentUsage) {
    return { legal: false, reason: 'must use at least as many owned segments as any single opponent', trackPointsByPlayer: {} };
  }

  const firstMatchingCityIndex = input.cities.findIndex((city) => city.color === input.cubeColor);
  if (firstMatchingCityIndex < 0) {
    return { legal: false, reason: 'no matching city on route', trackPointsByPlayer: {} };
  }

  if (firstMatchingCityIndex !== input.cities.length - 1) {
    return { legal: false, reason: 'must stop at the first matching city', trackPointsByPlayer: {} };
  }

  const trackPointsByPlayer: Record<string, number> = {};
  for (const segment of input.path) {
    if (!segment.ownerId) {
      continue;
    }
    trackPointsByPlayer[segment.ownerId] = (trackPointsByPlayer[segment.ownerId] ?? 0) + 1;
  }

  return {
    legal: true,
    firstMatchingCityIndex,
    trackPointsByPlayer,
  };
}
