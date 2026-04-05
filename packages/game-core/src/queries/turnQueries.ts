/**
 * 功能概述：整理顺位、当前行动者和已选行动牌相关的只读查询。
 * 输入输出：输入引擎会话；输出适合顺位面板渲染的列表。
 * 处理流程：先定位当前行动者，再把 turn order 映射成展示对象。
 */

import type { EngineSession } from "../contracts/engine";
import { getWorkingState } from "../actions/draftSession";

export interface TurnOrderEntryView {
  readonly playerId: string;
  readonly playerName: string;
  readonly selectedTileLabel: string | null;
  readonly isCurrent: boolean;
}

function playerNameById(session: EngineSession, playerId: string) {
  return getWorkingState(session).players.find((player) => player.id === playerId)?.name ?? playerId;
}

function currentPlayerId(session: EngineSession) {
  const state = getWorkingState(session);
  const order =
    state.turn.phase === "build-track" && state.turn.buildOrder.length > 0
      ? state.turn.buildOrder
      : (state.turn.phase === "move-goods-round-1"
        || state.turn.phase === "move-goods-round-2"
        || state.turn.phase === "resolve-delivery")
        && state.turn.moveOrder?.length
        ? state.turn.moveOrder
      : state.turn.turnOrder;
  return order[state.turn.currentPlayerIndex] ?? null;
}

/**
 * 功能：整理当前顺位与行动牌占用信息。
 * 参数：`session` 是当前引擎会话。
 * 返回：适合面板展示的顺位列表。
 * 逻辑：按当前 turnOrder 顺序输出玩家、行动牌与当前行动标记。
 */
export function getTurnOrderEntries(session: EngineSession): TurnOrderEntryView[] {
  const state = getWorkingState(session);
  const nowPlayerId = currentPlayerId(session);

  return state.turn.turnOrder.map((playerId) => ({
    playerId,
    playerName: playerNameById(session, playerId),
    selectedTileLabel:
      state.content.actionTiles.find((tile) => tile.id === state.turn.selectedActionTiles[playerId])?.label ?? null,
    isCurrent: playerId === nowPlayerId,
  }));
}
