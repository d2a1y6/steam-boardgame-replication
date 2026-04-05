/**
 * 功能概述：封装页面常用的对局命令，避免页面组件直接堆叠大量 applyAction 与 Bot 推进逻辑。
 * 输入输出：输入当前会话、行动者、Bot 与 provider 的更新函数；输出一组可直接绑定按钮的命令。
 * 处理流程：统一包装常见动作、阶段推进和调试推进，再把 notice 更新收束到同一入口。
 */

import {
  applyAction,
  commitDraft,
  resetDraft,
  runBotStep,
  selectCurrentPlayer,
  type ActionTileId,
  type Bot,
  type DeliveryCandidate,
  type EngineSession,
} from "@steam/game-core";

interface UseSessionCommandsOptions {
  session: EngineSession;
  currentPlayerId: string;
  humanPlayerId: string;
  phase: string;
  bot: Bot;
  updateSession: (nextSession: EngineSession, fallback: string, recordReplay?: boolean) => void;
}

/**
 * 功能：返回当前页面会复用的一组对局命令。
 * 参数：`options` 包含当前会话、行动者、Bot 与 provider 的更新入口。
 * 返回：一组可直接用于页面按钮和交互流程的命令。
 * 逻辑：让页面只处理“该不该调用”，真正的动作应用与 Bot 推进在这里统一完成。
 */
export function useSessionCommands(options: UseSessionCommandsOptions) {
  const { session, currentPlayerId, humanPlayerId, phase, bot, updateSession } = options;

  function selectActionTile(tileId: ActionTileId) {
    updateSession(
      applyAction(session, {
        type: "select-action-tile",
        playerId: humanPlayerId,
        tileId,
      }),
      "已选择行动牌。",
    );
  }

  function placeTrack(hexId: string, tileId: string, rotation: number) {
    updateSession(
      applyAction(session, {
        type: "place-track",
        playerId: humanPlayerId,
        hexId,
        tileId,
        rotation,
      }),
      "已把建轨写入草稿。",
    );
  }

  function finishBuild() {
    updateSession(
      applyAction(session, {
        type: "finish-build",
        playerId: humanPlayerId,
      }),
      "已结束建轨。",
    );
  }

  function resetBuild() {
    updateSession(resetDraft(session), "已回到本阶段起点。");
  }

  function commitBuildDraft() {
    updateSession(commitDraft(session), "已提交当前草稿。");
  }

  function deliverGoods(candidate: DeliveryCandidate) {
    updateSession(
      applyAction(session, {
        type: "deliver-goods",
        playerId: humanPlayerId,
        candidateId: candidate.id,
      }),
      "已执行运货。",
    );
  }

  function upgradeLocomotive() {
    updateSession(
      applyAction(session, {
        type: "upgrade-locomotive",
        playerId: humanPlayerId,
      }),
      "已升级机车。",
    );
  }

  function passMove() {
    updateSession(
      applyAction(session, {
        type: "pass-move",
        playerId: humanPlayerId,
      }),
      "已跳过当前货运轮次。",
    );
  }

  function resolveCurrentPhase() {
    if (phase === "income") {
      updateSession(
        applyAction(session, { type: "resolve-income", playerId: humanPlayerId }),
        "已结算收入。",
      );
      return;
    }
    if (phase === "determine-order") {
      updateSession(applyAction(session, { type: "advance-turn-order" }), "已确认顺位。");
      return;
    }
    if (phase === "set-up-next-turn") {
      updateSession(applyAction(session, { type: "set-up-next-turn" }), "已进入下一回合。");
    }
  }

  function advanceBotsUntilHuman() {
    let nextSession = session;
    let safety = 0;

    while (safety < 64) {
      const activePlayer = selectCurrentPlayer(nextSession);
      if (activePlayer.id === humanPlayerId && !activePlayer.isBot) {
        break;
      }
      const advanced = runBotStep(nextSession, bot, activePlayer.id);
      if (advanced === nextSession) {
        break;
      }
      nextSession = advanced;
      safety += 1;
    }

    updateSession(nextSession, "已推进到你的回合。");
  }

  function debugStep() {
    const nextSession = runBotStep(session, bot, currentPlayerId);
    updateSession(nextSession, "已自动执行一步。");
  }

  function debugMany() {
    let nextSession = session;

    for (let step = 0; step < 10; step += 1) {
      const activePlayer = selectCurrentPlayer(nextSession);
      const advanced = runBotStep(nextSession, bot, activePlayer.id);
      if (advanced === nextSession) {
        break;
      }
      nextSession = advanced;
    }

    updateSession(nextSession, "已自动推进十步。");
  }

  return {
    selectActionTile,
    placeTrack,
    finishBuild,
    resetBuild,
    commitBuildDraft,
    deliverGoods,
    upgradeLocomotive,
    passMove,
    resolveCurrentPhase,
    advanceBotsUntilHuman,
    debugStep,
    debugMany,
  };
}
