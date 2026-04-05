/**
 * 功能概述：把一条动作分派到对应处理器，并把结果写回引擎会话。
 * 输入输出：输入引擎会话与一条 GameAction；输出更新后的引擎会话。
 * 处理流程：先校验行动时机，再把动作交给选牌、建轨、货运或阶段推进处理器，最后追加动作历史。
 */

import type { GameAction } from "../state/actionTypes";
import type { EngineSession } from "../contracts/engine";
import { cloneState } from "../utils";
import { updateDraftWorking } from "./draftSession";
import { deliverGoods, passMove, upgradeLocomotive } from "./handlers/moveGoods";
import { finishBuild, resolveIncomeAction, advanceTurnOrderAction, setUpNextTurnAction } from "./handlers/phaseFlow";
import { placeTrackInDraft } from "./handlers/placeTrack";
import { setSelectedActionTile } from "./handlers/selectActionTile";
import { appendHistory, getCurrentPlayerId, withOutOfTurnWarning } from "./handlers/shared";

/**
 * 功能：把一条动作应用到引擎会话。
 * 参数：`session` 是当前会话，`action` 是一条显式动作。
 * 返回：更新后的会话；对建轨会保留 draft，其余阶段直接更新 committed。
 * 逻辑：总控只负责分派与写回，具体规则逻辑都落在 handlers 中。
 */
export function applyAction(session: EngineSession, action: GameAction): EngineSession {
  const state = session.draft?.working ?? session.committed;
  const currentPlayerId = getCurrentPlayerId(state);

  if ("playerId" in action && action.playerId !== currentPlayerId) {
    return withOutOfTurnWarning(session, action.playerId);
  }

  switch (action.type) {
    case "select-action-tile":
      return appendHistory(
        session,
        action,
        setSelectedActionTile(cloneState(session.committed), action.playerId, action.tileId),
        null,
      );

    case "place-track":
      return appendHistory(
        session,
        action,
        session.committed,
        updateDraftWorking(session, (working) => placeTrackInDraft(working, action)).draft,
      );

    case "finish-build":
      return appendHistory(session, action, finishBuild(session), null);

    case "deliver-goods":
      return appendHistory(
        session,
        action,
        deliverGoods(cloneState(session.committed), action),
        null,
      );

    case "upgrade-locomotive":
      return appendHistory(
        session,
        action,
        upgradeLocomotive(cloneState(session.committed), action.playerId),
        null,
      );

    case "pass-move":
      return appendHistory(
        session,
        action,
        passMove(cloneState(session.committed), action.playerId),
        null,
      );

    case "resolve-income":
      return appendHistory(session, action, resolveIncomeAction(session.committed), null);

    case "advance-turn-order":
      return appendHistory(session, action, advanceTurnOrderAction(session.committed), null);

    case "set-up-next-turn":
      return appendHistory(session, action, setUpNextTurnAction(session.committed), null);
  }
}
