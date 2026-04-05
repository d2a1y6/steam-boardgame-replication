/**
 * 引擎层共享类型。
 * 输入是已提交状态与阶段草稿，输出给选择器、Bot 和 UI 的轻量会话视图。
 * 这里不包含具体规则判定，只负责把引擎入口需要的结构摆平。
 */

import type { GameAction } from "../state/actionTypes";
import type { DraftState } from "../state/draftState";
import type { GameState, PlayerState } from "../state/gameState";
import type { GameMode } from "./domain";

export interface GameSetupConfig {
  readonly mode: GameMode;
  readonly mapId: string;
  readonly playerCount: number;
  readonly humanPlayerIndex: number;
}

export interface SessionActionRecord {
  readonly index: number;
  readonly action: GameAction | { type: "system"; label: string };
  readonly phase: GameState["turn"]["phase"];
  readonly round: number;
  readonly activePlayerId: string | null;
  readonly summary: string;
}

export interface EngineSession {
  readonly committed: GameState;
  readonly draft: DraftState | null;
  readonly config: GameSetupConfig;
  readonly actionHistory: readonly SessionActionRecord[];
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
