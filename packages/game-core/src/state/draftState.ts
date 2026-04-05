/**
 * 功能概述：定义阶段草稿状态，支撑“回合内重置”而非脆弱的一步撤销。
 * 输入输出：不直接处理输入；导出草稿结构供 draft session 与 UI 使用。
 * 处理流程：同时保存阶段起点快照、当前工作副本和草稿日志。
 */

import type { GameState, GameLogEntry } from "./gameState";

export interface DraftState {
  phaseName: GameState["turn"]["phase"];
  snapshot: GameState;
  working: GameState;
  startedAtRound: number;
  startedAtPhase: GameState["turn"]["phase"];
  dirty: boolean;
  reason: string;
  draftLogs: GameLogEntry[];
}
