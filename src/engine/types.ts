/**
 * 引擎层共享类型。
 * 输入是已提交状态与阶段草稿，输出给选择器、Bot 和 UI 的轻量会话视图。
 * 这里不包含具体规则判定，只负责把引擎入口需要的结构摆平。
 */

import type { GameAction } from "../state/actionTypes";
import type { DraftState } from "../state/draftState";
import type { GameState, PlayerState } from "../state/gameState";

export interface EngineSession {
  readonly committed: GameState;
  readonly draft: DraftState | null;
}

export interface ActionNotice {
  readonly level: "info" | "warning" | "error";
  readonly message: string;
}

export interface ActionResult {
  readonly ok: boolean;
  readonly session: EngineSession;
  readonly notices: readonly ActionNotice[];
}

export interface ActionOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly disabled?: boolean;
}

export interface PhaseSummary {
  readonly phaseLabel: string;
  readonly roundLabel: string;
  readonly activePlayerLabel: string;
  readonly actionLabel?: string;
}

export interface SelectedActionState {
  readonly player: PlayerState;
  readonly action: GameAction | null;
}
