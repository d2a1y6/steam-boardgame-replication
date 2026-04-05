/**
 * 功能概述：为本地页面提供轻量的回放帧记录与恢复能力。
 * 输入输出：输入当前会话与一条摘要文本；输出新的回放帧列表或恢复出的会话。
 * 处理流程：在每次有效状态推进后记录一帧快照，并允许按帧恢复 committed/draft。
 */

import type { EngineSession } from "../contracts/engine";
import { cloneState } from "../utils";

export type ReplaySnapshot = EngineSession;

export interface ReplayFrame {
  id: string;
  label: string;
  round: number;
  phase: string;
  activePlayerName: string;
  createdAt: string;
  snapshot: ReplaySnapshot;
}

function currentGame(session: EngineSession) {
  return session.draft?.working ?? session.committed;
}

function currentPlayerName(session: EngineSession) {
  const game = currentGame(session);
  const order =
    game.turn.phase === "build-track" && game.turn.buildOrder.length > 0
      ? game.turn.buildOrder
      : game.turn.turnOrder;
  const currentPlayerId = order[game.turn.currentPlayerIndex] ?? null;
  return game.players.find((player) => player.id === currentPlayerId)?.name ?? "无";
}

/**
 * 功能：创建一条新的回放帧。
 * 参数：`session` 是当前引擎会话，`label` 是本次状态推进的简短说明。
 * 返回：包含 committed/draft 快照的一条回放记录。
 * 逻辑：快照只保存会话状态，不保存回放数组自身，从而避免递归结构。
 */
export function createReplayFrame(session: EngineSession, label: string): ReplayFrame {
  const game = currentGame(session);
  return {
    id: `replay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    round: game.turn.round,
    phase: game.turn.phase,
    activePlayerName: currentPlayerName(session),
    createdAt: new Date().toISOString(),
    snapshot: cloneState(session),
  };
}

/**
 * 功能：向现有回放时间线追加一帧。
 * 参数：`frames` 是已有回放数组，`session` 是当前会话，`label` 是当前摘要。
 * 返回：裁剪后的新回放数组。
 * 逻辑：默认保留最近 80 帧，避免本地状态无限膨胀。
 */
export function appendReplayFrame(
  frames: readonly ReplayFrame[],
  session: EngineSession,
  label: string,
  limit = 80,
): ReplayFrame[] {
  return [...frames, createReplayFrame(session, label)].slice(-limit);
}

/**
 * 功能：从一条回放帧恢复引擎会话。
 * 参数：`frame` 是已经记录好的回放帧。
 * 返回：一个可继续运行的新引擎会话。
 * 逻辑：直接恢复 committed 与 draft 快照，不修改其他局面信息。
 */
export function restoreReplayFrame(frame: ReplayFrame): EngineSession {
  return cloneState(frame.snapshot);
}
