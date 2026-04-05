/**
 * 功能概述：处理阶段推进、跳过货运、收入结算与下一回合准备等动作。
 * 输入输出：输入当前状态或会话；输出对应阶段推进后的新状态。
 * 处理流程：把阶段级动作集中管理，让 `applyAction` 只负责分派。
 */

import type { GameState } from "../../state/gameState";
import type { EngineSession } from "../../contracts/engine";
import { resolveIncome } from "../../rules/finance";
import { cloneState } from "../../utils";
import { advancePhase, advancePlayerInBuildPhase, advancePlayerPhase, enterPhase, nextMovePhase } from "../phaseMachine";
import { commitDraft } from "../draftSession";
import { appendLog } from "../helpers";

export function handleFinishBuild(session: EngineSession) {
  return advancePlayerInBuildPhase(commitDraft(session).committed);
}

export function handlePassMove(state: GameState, playerId: string): GameState {
  return appendLog(
    advancePlayerPhase(cloneState(state), nextMovePhase(state)),
    "info",
    `${playerId} 放弃本轮货运。`,
  );
}

export function handleResolveIncome(session: EngineSession) {
  return advancePhase({
    ...cloneState(session.committed),
    players: cloneState(session.committed.players).map((player) => resolveIncome(player, session.committed.mode)),
  });
}

export function handleAdvanceTurnOrder(session: EngineSession) {
  return advancePhase(cloneState(session.committed));
}

export function handleSetUpNextTurn(session: EngineSession) {
  return enterPhase(cloneState(session.committed), session.committed.mode === "standard" ? "buy-capital" : "select-action");
}
