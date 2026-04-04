/**
 * 功能概述：管理阶段草稿，支撑“提交本阶段”与“回到阶段起点”。
 * 输入输出：输入引擎会话；输出带新草稿状态的引擎会话或工作态 GameState。
 * 处理流程：从 committed 创建 snapshot，允许 working 反复改动，最后决定提交还是回滚。
 */

import type { DraftState } from "../state/draftState";
import type { GameState } from "../state/gameState";
import type { EngineSession } from "./types";
import { cloneState } from "./utils";

function createDraftState(committed: GameState, reason: string): DraftState {
  return {
    phaseName: committed.turn.phase,
    snapshot: cloneState(committed),
    working: cloneState(committed),
    startedAtRound: committed.turn.round,
    startedAtPhase: committed.turn.phase,
    dirty: false,
    reason,
    draftLogs: [],
  };
}

/**
 * 功能：开启当前阶段草稿。
 * 参数：`session` 是当前会话，`reason` 记录为什么需要这份草稿。
 * 返回：若已有草稿则原样返回，否则创建一份从 committed 拷贝出的草稿。
 * 逻辑：草稿只在需要临时试走的阶段打开，例如建轨阶段。
 */
export function beginDraft(session: EngineSession, reason = "阶段内试走"): EngineSession {
  if (session.draft) {
    return session;
  }

  return {
    committed: session.committed,
    draft: createDraftState(session.committed, reason),
  };
}

/**
 * 功能：确保会话上存在可写草稿。
 * 参数：`session` 是当前引擎会话，`reason` 是创建草稿时的备注。
 * 返回：一个肯定带有 draft 的会话。
 * 逻辑：如果草稿已存在则直接复用，否则立刻从 committed 派生。
 */
export function ensureDraft(session: EngineSession, reason = "阶段内试走"): EngineSession {
  return session.draft ? session : beginDraft(session, reason);
}

/**
 * 功能：读取当前工作态。
 * 参数：`session` 是引擎会话。
 * 返回：若存在草稿则返回 working，否则返回 committed。
 * 逻辑：UI、Bot 和选择器统一从这里拿“当前应该被看到的局面”。
 */
export function getWorkingState(session: EngineSession): GameState {
  return session.draft?.working ?? session.committed;
}

/**
 * 功能：更新当前 working 局面。
 * 参数：`session` 是会话，`updater` 是对 working 状态的纯函数变换。
 * 返回：带更新后草稿的新会话。
 * 逻辑：先保证草稿存在，再只改 working，不碰 committed。
 */
export function updateDraftWorking(
  session: EngineSession,
  updater: (working: GameState) => GameState,
): EngineSession {
  const nextSession = ensureDraft(session);
  const nextWorking = updater(cloneState(getWorkingState(nextSession)));

  return {
    committed: nextSession.committed,
    draft: nextSession.draft
      ? {
          ...nextSession.draft,
          working: nextWorking,
          dirty: true,
        }
      : null,
  };
}

/**
 * 功能：把当前草稿回滚到阶段起点。
 * 参数：`session` 是当前引擎会话。
 * 返回：working 恢复成 snapshot 的新会话。
 * 逻辑：只重置草稿，不影响 committed。
 */
export function resetDraft(session: EngineSession): EngineSession {
  if (!session.draft) {
    return session;
  }

  return {
    committed: session.committed,
    draft: {
      ...session.draft,
      working: cloneState(session.draft.snapshot),
      dirty: false,
      draftLogs: [],
    },
  };
}

/**
 * 功能：提交当前草稿。
 * 参数：`session` 是当前会话。
 * 返回：把 working 写回 committed 且关闭草稿的会话。
 * 逻辑：建轨阶段结束后由这里落盘，后续阶段再从正式状态继续推进。
 */
export function commitDraft(session: EngineSession): EngineSession {
  if (!session.draft) {
    return session;
  }

  return {
    committed: cloneState(session.draft.working),
    draft: null,
  };
}
