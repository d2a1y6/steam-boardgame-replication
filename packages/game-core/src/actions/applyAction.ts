/**
 * 功能概述：把一条动作分派到对应处理器，并把结果写回引擎会话。
 * 输入输出：输入引擎会话与一条 GameAction；输出更新后的引擎会话。
 * 处理流程：先校验行动时机，再分派到选牌、建轨、货运、标准版或阶段推进处理器，最后追加动作历史。
 */

import type { GameAction } from "../state/actionTypes";
import type { EngineSession } from "../contracts/engine";
import { cloneState } from "../utils";
import { updateDraftWorking } from "./draftSession";
import {
  chooseTrackPointsDestination,
  deliverGoods,
  passMove,
  upgradeLocomotive,
} from "./handlers/moveGoods";
import { finishBuild, resolveIncomeAction, advanceTurnOrderAction, setUpNextTurnAction } from "./handlers/phaseFlow";
import { placeTrackInDraft } from "./handlers/placeTrack";
import { performCityGrowth, performUrbanization } from "./handlers/cityActions";
import { setSelectedActionTile } from "./handlers/selectActionTile";
import { buyCapital, passAuction, placeAuctionBid } from "./handlers/standardTurn";
import { appendHistory, getCurrentPlayerId, withOutOfTurnWarning } from "./handlers/shared";

/**
 * 功能：把一条动作应用到引擎会话。
 * 参数：`session` 是当前会话，`action` 是一条显式动作。
 * 返回：更新后的会话；建轨相关动作会继续保留 draft，其余阶段直接更新 committed。
 * 逻辑：总控只做时机校验和分派，不在这里写具体规则。
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
        setSelectedActionTile(cloneState(session.committed), action.playerId, action.tileId, action.usePassOption),
        null,
      );

    case "perform-city-growth":
      return appendHistory(
        session,
        action,
        performCityGrowth(cloneState(session.committed), action),
        null,
      );

    case "perform-urbanization":
      return appendHistory(
        session,
        action,
        performUrbanization(cloneState(session.committed), action),
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
      return appendHistory(session, action, deliverGoods(cloneState(session.committed), action), null);

    case "choose-track-points-destination":
      return appendHistory(
        session,
        action,
        chooseTrackPointsDestination(cloneState(session.committed), action.playerId, action.destination),
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
      return appendHistory(session, action, passMove(cloneState(session.committed), action.playerId), null);

    case "buy-capital":
      return appendHistory(session, action, buyCapital(cloneState(session.committed), action), null);

    case "place-auction-bid":
      return appendHistory(session, action, placeAuctionBid(cloneState(session.committed), action), null);

    case "pass-auction":
      return appendHistory(session, action, passAuction(cloneState(session.committed), action), null);

    case "resolve-income":
      return appendHistory(session, action, resolveIncomeAction(cloneState(session.committed)), null);

    case "advance-turn-order":
      return appendHistory(session, action, advanceTurnOrderAction(cloneState(session.committed)), null);

    case "set-up-next-turn":
      return appendHistory(session, action, setUpNextTurnAction(cloneState(session.committed)), null);
  }
}
