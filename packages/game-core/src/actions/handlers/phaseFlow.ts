/**
 * 功能概述：处理建轨结束、收入、顺位确认和下一回合准备等阶段推进动作。
 * 输入输出：输入会话或正式状态；输出推进后的正式状态。
 * 处理流程：复用阶段机函数，把原本散在总控里的阶段动作拆成独立处理器。
 */

import { resolveIncome } from "../../rules/finance";
import type { EngineSession } from "../../contracts/engine";
import type { GameState } from "../../state/gameState";
import { cloneState } from "../../utils";
import { commitDraft } from "../draftSession";
import { enterPhase } from "../phaseMachine";
import { advancePlayerInBuildPhase, advanceTurnOrderPhase, resolveIncomePhase } from "./shared";

/**
 * 功能：结束当前玩家的建轨阶段，并在需要时进入货运阶段。
 * 参数：`session` 是当前引擎会话。
 * 返回：更新后的正式状态。
 * 逻辑：先提交当前草稿，再推进建轨顺位。
 */
export function finishBuild(session: EngineSession): GameState {
  return advancePlayerInBuildPhase(commitDraft(session).committed);
}

/**
 * 功能：执行收入阶段结算。
 * 参数：`state` 是当前正式状态。
 * 返回：推进后的正式状态。
 * 逻辑：为所有玩家结算收入，再交给阶段机推进到下一阶段。
 */
export function resolveIncomeAction(state: GameState): GameState {
  return resolveIncomePhase({
    ...cloneState(state),
    players: cloneState(state.players).map((player) => resolveIncome(player)),
  });
}

/**
 * 功能：确认本回合顺位并进入下一阶段。
 * 参数：`state` 是当前正式状态。
 * 返回：推进后的正式状态。
 * 逻辑：交给阶段机推进，不额外修改领域数据。
 */
export function advanceTurnOrderAction(state: GameState): GameState {
  return advanceTurnOrderPhase(cloneState(state));
}

/**
 * 功能：进入下一回合的行动牌选择阶段。
 * 参数：`state` 是当前正式状态。
 * 返回：下一回合的正式状态。
 * 逻辑：让阶段机负责重置回合级字段和日志。
 */
export function setUpNextTurnAction(state: GameState): GameState {
  return enterPhase(cloneState(state), "select-action");
}
