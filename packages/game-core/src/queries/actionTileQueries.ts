/**
 * 功能概述：整理行动牌阶段相关的只读查询。
 * 输入输出：输入引擎会话；输出带占用信息的行动牌列表。
 * 处理流程：读取当前工作态中的行动牌定义和已选状态，再拼成 UI 可直接消费的对象。
 */

import type { EngineSession } from "../contracts/engine";
import { getWorkingState } from "../actions/draftSession";

export interface SelectableActionTileView {
  readonly tileId: string;
  readonly label: string;
  readonly value: number;
  readonly disabled: boolean;
  readonly selectedByPlayerId: string | null;
  readonly hasPassOption: boolean;
}

/**
 * 功能：列出当前仍可选择的行动牌。
 * 参数：`session` 是当前引擎会话。
 * 返回：带占用信息的行动牌列表。
 * 逻辑：把已被其他玩家拿走的牌标记出来，供 UI 决定禁用态。
 */
export function getSelectableActionTiles(session: EngineSession): SelectableActionTileView[] {
  const state = getWorkingState(session);
  return state.content.actionTiles.map((tile) => {
    const selectedByEntry = Object.entries(state.turn.selectedActionTiles).find(([, selected]) => selected === tile.id);
    return {
      tileId: tile.id,
      label: tile.label,
      value: tile.value,
      disabled: Boolean(selectedByEntry),
      selectedByPlayerId: selectedByEntry?.[0] ?? null,
      hasPassOption: tile.hasPassOption,
    };
  });
}
