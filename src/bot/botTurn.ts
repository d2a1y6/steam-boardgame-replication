/**
 * 功能概述：驱动 Bot 在自己的回合里执行一步动作。
 * 输入输出：输入当前引擎会话、Bot 与玩家 id；输出更新后的引擎会话。
 * 处理流程：先让 Bot 选动作，再交给 applyAction 处理；如果 Bot 不出手就保持原状态。
 */

import { applyAction } from "../engine/applyAction";
import type { EngineSession } from "../engine/types";
import type { GameState } from "../state/gameState";
import type { GameAction } from "../state/actionTypes";
import type { Bot } from "./Bot";

function getWorkingGame(session: EngineSession): GameState {
  return session.draft?.working ?? session.committed;
}

/**
 * 功能：执行 Bot 的单步回合推进。
 * 参数：`session` 是当前引擎会话，`bot` 是出手策略，`playerId` 是当前行动玩家。
 * 返回：经过一次 Bot 动作后的新会话；如果 Bot 没有动作，则返回原会话。
 * 逻辑：先读取当前工作态，再让 Bot 产出一条动作，最后交给引擎统一执行。
 */
export function runBotStep(session: EngineSession, bot: Bot, playerId: string): EngineSession {
  const action: GameAction | null = bot.getMove(getWorkingGame(session), playerId);
  if (!action) {
    return session;
  }
  return applyAction(session, action);
}
