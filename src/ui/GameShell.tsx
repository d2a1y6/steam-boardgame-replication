/**
 * 功能概述：把规则引擎会话接到第二部分的真人可操作原型界面上。
 * 输入输出：不接收外部参数；输出一局“1 真人 + 2 Bot”的基础版本地页面。
 * 处理流程：创建会话、整理合法动作和预览、响应地图点击与面板选择，再把动作送回引擎。
 */

import { useEffect, useState } from "react";
import { RandomBot } from "../bot/RandomBot";
import { runBotStep } from "../bot/botTurn";
import type { ActionTileId } from "../data/setup/actionTiles";
import { applyAction } from "../engine/applyAction";
import { createGame } from "../engine/createGame";
import {
  getBuildableHexIds,
  getMovableGoodsSources,
  getRankedDeliveryCandidatesForSource,
  getSelectableActionTiles,
  getTilePoolSummary,
  getTrackPaletteOptions,
  getTrackPlacementOptions,
  getTurnOrderEntries,
} from "../engine/legalMoves";
import { commitDraft, getWorkingState, resetDraft } from "../engine/draftSession";
import { getDeliveryPreview, getTrackPlacementPreview } from "../engine/previews";
import { selectCurrentPlayer, selectPhaseSummary } from "../engine/selectors";
import type { EngineSession } from "../engine/types";
import { ActionTilePanel } from "./ActionTilePanel";
import { DeliveryCandidatePanel } from "./DeliveryCandidatePanel";
import { DeliveryPreview } from "./DeliveryPreview";
import { DeliverySourcePanel } from "./DeliverySourcePanel";
import { GoodsSupplyPanel } from "./GoodsSupplyPanel";
import { IllegalMoveNotice } from "./IllegalMoveNotice";
import { LogPanel } from "./LogPanel";
import { MapBoard } from "./MapBoard";
import { PhasePanel, type PhaseControl } from "./PhasePanel";
import { PlayerPanel } from "./PlayerPanel";
import { RuleHintPanel } from "./RuleHintPanel";
import { TilePoolPanel } from "./TilePoolPanel";
import { TrackPalettePanel } from "./TrackPalettePanel";
import { TrackPlacementPanel } from "./TrackPlacementPanel";
import { TurnOrderPanel } from "./TurnOrderPanel";

const HUMAN_PLAYER_ID = "player-1";

function createPlayableSession(): EngineSession {
  return createGame({
    playerNames: ["Ada", "Babbage", "Curie"],
    botPlayerIds: ["player-2", "player-3"],
    mapId: "ne-usa-se-canada",
    mode: "base",
  });
}

function latestNotice(session: EngineSession, fallback: string): string {
  const state = getWorkingState(session);
  return state.logs[state.logs.length - 1]?.message ?? fallback;
}

function describeHint(session: EngineSession, isHumanTurn: boolean): string {
  const state = getWorkingState(session);
  if (!isHumanTurn) {
    return "当前轮到 Bot。点“推进到我的回合”可以让系统自动代走，直到再次轮到你。";
  }
  if (state.turn.phase === "select-action") {
    return "先在行动牌面板里选择一张未被占用的行动牌。你选完后，其他 Bot 仍要继续选牌。";
  }
  if (state.turn.phase === "build-track") {
    return "先选轨道板，再点地图上的高亮 hex，随后在建轨工作台里选朝向并确认。每一步都会先写进草稿层。";
  }
  if (state.turn.phase === "move-goods-round-1" || state.turn.phase === "move-goods-round-2") {
    return "先选货物源，再选候选运输方案。若没有合法方案，可升级机车或跳过本轮货运。";
  }
  if (state.turn.phase === "income" || state.turn.phase === "determine-order" || state.turn.phase === "set-up-next-turn") {
    return "这几个阶段目前用单按钮推进，重点是确认回合、顺位和日志是否对得上。";
  }
  return "当前是第二部分基础版原型，重点是让真人能实际操作关键阶段。";
}

function parseSourceKey(sourceId: string | null) {
  if (!sourceId) {
    return null;
  }
  const [sourceHexId, goodsColor] = sourceId.split(":");
  if (!sourceHexId || !goodsColor) {
    return null;
  }
  return { sourceHexId, goodsColor };
}

/**
 * 功能：渲染第二部分主页面。
 * 参数：无。
 * 返回：一个本地可操作的基础版原型页面。
 * 逻辑：把真人交互放到主位，Bot 只负责非真人回合与调试推进。
 */
export function GameShell() {
  const [session, setSession] = useState<EngineSession>(() => createPlayableSession());
  const [notice, setNotice] = useState("当前默认由 Ada 作为真人玩家；先在行动牌面板中选牌。");
  const [selectedTrackTileId, setSelectedTrackTileId] = useState<string | null>("21");
  const [selectedBuildHexId, setSelectedBuildHexId] = useState<string | null>(null);
  const [selectedRotation, setSelectedRotation] = useState<number | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const bot = new RandomBot(() => 0);

  const game = getWorkingState(session);
  const currentPlayer = selectCurrentPlayer(session);
  const phaseSummary = selectPhaseSummary(session);
  const isHumanTurn = currentPlayer.id === HUMAN_PLAYER_ID && !currentPlayer.isBot;

  useEffect(() => {
    setSelectedBuildHexId(null);
    setSelectedRotation(null);
    setSelectedSourceId(null);
    setSelectedCandidateId(null);
  }, [game.turn.phase, currentPlayer.id]);

  const actionTiles = getSelectableActionTiles(session);
  const trackPalette = getTrackPaletteOptions(session);
  const tilePoolSummary = getTilePoolSummary(session);
  const turnOrderEntries = getTurnOrderEntries(session);
  const movableSources = isHumanTurn ? getMovableGoodsSources(session, HUMAN_PLAYER_ID) : [];

  const buildableHexIds =
    isHumanTurn && game.turn.phase === "build-track" && selectedTrackTileId
      ? getBuildableHexIds(session, HUMAN_PLAYER_ID, selectedTrackTileId)
      : [];

  const placementOptions =
    isHumanTurn && game.turn.phase === "build-track" && selectedTrackTileId && selectedBuildHexId
      ? getTrackPlacementOptions(session, HUMAN_PLAYER_ID, selectedTrackTileId, selectedBuildHexId)
      : [];

  const effectiveRotation =
    selectedRotation != null
      ? selectedRotation
      : placementOptions.length > 0
        ? placementOptions[0]!.rotation
        : null;

  const trackPreview =
    isHumanTurn &&
    game.turn.phase === "build-track" &&
    selectedTrackTileId &&
    selectedBuildHexId &&
    effectiveRotation != null
      ? getTrackPlacementPreview(session, HUMAN_PLAYER_ID, selectedTrackTileId, selectedBuildHexId, effectiveRotation)
      : null;

  const sourceKey = parseSourceKey(selectedSourceId);
  const rankedCandidates =
    isHumanTurn && sourceKey
      ? getRankedDeliveryCandidatesForSource(session, HUMAN_PLAYER_ID, sourceKey.sourceHexId, sourceKey.goodsColor)
      : [];

  const selectedCandidate =
    rankedCandidates.find((candidate) => candidate.id === selectedCandidateId)
    ?? rankedCandidates[0]
    ?? null;

  const deliveryPreview = selectedCandidate ? getDeliveryPreview(session, selectedCandidate) : null;

  const highlightedHexIds =
    game.turn.phase === "move-goods-round-1" || game.turn.phase === "move-goods-round-2"
      ? selectedCandidate?.pathStopIds ?? (sourceKey ? [sourceKey.sourceHexId] : [])
      : selectedBuildHexId
        ? [selectedBuildHexId]
        : [];

  const clickableHexIds =
    isHumanTurn && game.turn.phase === "build-track"
      ? buildableHexIds
      : isHumanTurn && (game.turn.phase === "move-goods-round-1" || game.turn.phase === "move-goods-round-2")
        ? movableSources.map((source) => source.sourceHexId)
        : [];

  function updateSession(nextSession: EngineSession, fallback: string) {
    setSession(nextSession);
    setNotice(latestNotice(nextSession, fallback));
  }

  function handleSelectActionTile(tileId: string) {
    updateSession(
      applyAction(session, {
        type: "select-action-tile",
        playerId: HUMAN_PLAYER_ID,
        tileId: tileId as ActionTileId,
      }),
      "已选择行动牌。",
    );
  }

  function handleConfirmTrack() {
    if (!selectedTrackTileId || !selectedBuildHexId || effectiveRotation == null) {
      setNotice("先选轨道板、hex 和朝向。");
      return;
    }

    updateSession(
      applyAction(session, {
        type: "place-track",
        playerId: HUMAN_PLAYER_ID,
        hexId: selectedBuildHexId,
        tileId: selectedTrackTileId,
        rotation: effectiveRotation,
      }),
      "已把建轨写入草稿。",
    );
    setSelectedBuildHexId(null);
    setSelectedRotation(null);
  }

  function handleFinishBuild() {
    updateSession(
      applyAction(session, {
        type: "finish-build",
        playerId: HUMAN_PLAYER_ID,
      }),
      "已结束建轨。",
    );
  }

  function handleResetBuild() {
    if (!session.draft) {
      setNotice("当前没有草稿可重置。");
      return;
    }
    updateSession(resetDraft(session), "已回到本阶段起点。");
  }

  function handleCommitDraft() {
    if (!session.draft) {
      setNotice("当前没有草稿可提交。");
      return;
    }
    updateSession(commitDraft(session), "已提交当前草稿。");
  }

  function handleSelectSource(sourceId: string) {
    setSelectedSourceId(sourceId);
    setSelectedCandidateId(null);
  }

  function handleConfirmDelivery() {
    if (!selectedCandidate) {
      setNotice("先选择一个运输候选方案。");
      return;
    }
    updateSession(
      applyAction(session, {
        type: "deliver-goods",
        playerId: HUMAN_PLAYER_ID,
        candidateId: selectedCandidate.id,
      }),
      "已执行运货。",
    );
  }

  function handleUpgradeLocomotive() {
    updateSession(
      applyAction(session, {
        type: "upgrade-locomotive",
        playerId: HUMAN_PLAYER_ID,
      }),
      "已升级机车。",
    );
  }

  function handlePassMove() {
    updateSession(
      applyAction(session, {
        type: "pass-move",
        playerId: HUMAN_PLAYER_ID,
      }),
      "已跳过当前货运轮次。",
    );
  }

  function handleResolveCurrentPhase() {
    if (game.turn.phase === "income") {
      updateSession(
        applyAction(session, { type: "resolve-income", playerId: HUMAN_PLAYER_ID }),
        "已结算收入。",
      );
      return;
    }
    if (game.turn.phase === "determine-order") {
      updateSession(applyAction(session, { type: "advance-turn-order" }), "已确认顺位。");
      return;
    }
    if (game.turn.phase === "set-up-next-turn") {
      updateSession(applyAction(session, { type: "set-up-next-turn" }), "已进入下一回合。");
    }
  }

  function handleAdvanceBotsUntilHuman() {
    let nextSession = session;
    let safety = 0;
    while (safety < 64) {
      const activePlayer = selectCurrentPlayer(nextSession);
      if (activePlayer.id === HUMAN_PLAYER_ID && !activePlayer.isBot) {
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

  function handleDebugStep() {
    const nextSession = runBotStep(session, bot, currentPlayer.id);
    updateSession(nextSession, "已自动执行一步。");
  }

  function handleDebugMany() {
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

  function handleMapHexClick(hexId: string) {
    if (!isHumanTurn) {
      return;
    }
    if (game.turn.phase === "build-track") {
      setSelectedBuildHexId(hexId);
      setSelectedRotation(null);
      return;
    }
    if (game.turn.phase === "move-goods-round-1" || game.turn.phase === "move-goods-round-2") {
      const source = movableSources.find((item) => item.sourceHexId === hexId);
      if (source) {
        handleSelectSource(source.id);
      }
    }
  }

  const phaseControls: PhaseControl[] = [
    {
      id: "bots",
      label: "推进到我的回合",
      disabled: isHumanTurn,
      onClick: handleAdvanceBotsUntilHuman,
    },
    {
      id: "debug-step",
      label: "调试：自动一步",
      onClick: handleDebugStep,
    },
    {
      id: "debug-many",
      label: "调试：自动十步",
      onClick: handleDebugMany,
    },
    {
      id: "commit-draft",
      label: "调试：提交草稿",
      disabled: !session.draft,
      onClick: handleCommitDraft,
    },
  ];

  const blockingMessage =
    notice.includes("不能")
    || notice.includes("不存在")
    || notice.includes("没有")
    || notice.includes("非法")
    || notice.includes("耗尽")
      ? notice
      : null;

  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Steam / 第二部分基础版原型</div>
          <h1 style={titleStyle}>Steam 规则学习壳</h1>
          <p style={subtitleStyle}>真人玩家现在可以手动选牌、建轨和运货；Bot 只负责其他座位和调试推进。</p>
        </div>
        <div style={statusStyle}>{phaseSummary.phaseLabel}</div>
      </header>

      <main style={mainStyle}>
        <section style={boardColumnStyle}>
          <MapBoard
            game={game}
            clickableHexIds={clickableHexIds}
            highlightedHexIds={highlightedHexIds}
            selectedHexId={game.turn.phase === "build-track" ? selectedBuildHexId : sourceKey?.sourceHexId ?? null}
            onHexClick={handleMapHexClick}
          />
        </section>

        <aside style={controlColumnStyle}>
          <PhasePanel
            summary={{
              currentPlayer,
              phase: phaseSummary.phaseLabel,
              round: game.turn.round,
              actionLabel: phaseSummary.actionLabel,
            }}
            notice={notice}
            controls={phaseControls}
          />
          <IllegalMoveNotice message={blockingMessage} />

          {isHumanTurn && game.turn.phase === "select-action" ? (
            <ActionTilePanel
              tiles={actionTiles}
              currentPlayerName={currentPlayer.name}
              onSelect={handleSelectActionTile}
            />
          ) : null}

          {isHumanTurn && game.turn.phase === "build-track" ? (
            <>
              <TrackPalettePanel
                items={trackPalette}
                selectedTileId={selectedTrackTileId}
                onSelect={setSelectedTrackTileId}
              />
              <TrackPlacementPanel
                selectedHexId={selectedBuildHexId}
                placementOptions={placementOptions}
                selectedRotation={effectiveRotation}
                preview={trackPreview}
                onSelectRotation={setSelectedRotation}
                onConfirm={handleConfirmTrack}
                onFinishBuild={handleFinishBuild}
                onReset={handleResetBuild}
              />
            </>
          ) : null}

          {isHumanTurn && (game.turn.phase === "move-goods-round-1" || game.turn.phase === "move-goods-round-2") ? (
            <>
              <DeliverySourcePanel
                sources={movableSources}
                selectedSourceId={selectedSourceId}
                onSelect={handleSelectSource}
              />
              <DeliveryCandidatePanel
                candidates={rankedCandidates}
                selectedCandidateId={selectedCandidate?.id ?? null}
                onSelect={setSelectedCandidateId}
              />
              <DeliveryPreview preview={deliveryPreview} />
              <section style={inlineActionPanelStyle}>
                <h2 style={inlineActionTitleStyle}>本轮操作</h2>
                <div style={inlineButtonRowStyle}>
                  <button style={inlineButtonStyle} type="button" onClick={handleConfirmDelivery} disabled={!selectedCandidate}>
                    确认运货
                  </button>
                  <button style={inlineButtonStyle} type="button" onClick={handleUpgradeLocomotive}>
                    升级机车
                  </button>
                  <button style={inlineButtonStyle} type="button" onClick={handlePassMove}>
                    跳过本轮
                  </button>
                </div>
              </section>
            </>
          ) : null}

          {isHumanTurn && (game.turn.phase === "income" || game.turn.phase === "determine-order" || game.turn.phase === "set-up-next-turn") ? (
            <section style={inlineActionPanelStyle}>
              <h2 style={inlineActionTitleStyle}>阶段推进</h2>
              <div style={inlineButtonRowStyle}>
                <button style={inlineButtonStyle} type="button" onClick={handleResolveCurrentPhase}>
                  执行当前阶段
                </button>
              </div>
            </section>
          ) : null}

          <RuleHintPanel text={describeHint(session, isHumanTurn)} />
        </aside>

        <aside style={infoColumnStyle}>
          <TurnOrderPanel entries={turnOrderEntries} />
          <PlayerPanel players={game.players} currentPlayerId={currentPlayer?.id ?? null} />
          <GoodsSupplyPanel
            goodsSupply={game.supply.goodsSupply}
            goodsBagCount={game.supply.goodsBag.length}
            newCityTilesCount={game.supply.newCityTiles.length}
          />
          <TilePoolPanel items={tilePoolSummary} selectedTileId={selectedTrackTileId} />
          <LogPanel logs={game.logs} />
        </aside>
      </main>
    </div>
  );
}

const shellStyle = {
  minHeight: "100vh",
  padding: "14px 16px",
  background:
    "radial-gradient(circle at top left, rgba(244,208,111,0.12), transparent 28%), radial-gradient(circle at top right, rgba(125,211,252,0.12), transparent 26%), linear-gradient(180deg, #0b1020 0%, #111827 100%)",
  color: "#f8fafc",
  boxSizing: "border-box",
  overflow: "hidden",
} as const;

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "14px",
  marginBottom: "10px",
  maxWidth: "1600px",
  marginInline: "auto",
} as const;

const eyebrowStyle = {
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(248,250,252,0.58)",
} as const;

const titleStyle = {
  margin: "4px 0 0",
  fontSize: "22px",
  lineHeight: 1.1,
} as const;

const subtitleStyle = {
  marginTop: "5px",
  fontSize: "12.5px",
  lineHeight: 1.3,
  color: "rgba(248,250,252,0.72)",
} as const;

const statusStyle = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontSize: "12.5px",
  color: "#f4d06f",
  whiteSpace: "nowrap",
} as const;

const mainStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.1fr) minmax(340px, 430px) minmax(280px, 340px)",
  gap: "12px",
  alignItems: "stretch",
  minHeight: "calc(100vh - 86px)",
  maxWidth: "1600px",
  margin: "0 auto",
} as const;

const boardColumnStyle = {
  minWidth: 0,
  minHeight: 0,
  padding: "10px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
} as const;

const controlColumnStyle = {
  display: "grid",
  gridAutoRows: "max-content",
  gap: "10px",
  minWidth: 0,
  minHeight: 0,
  overflow: "auto",
  paddingRight: "2px",
} as const;

const infoColumnStyle = {
  display: "grid",
  gridTemplateRows: "max-content max-content max-content max-content minmax(0, 1fr)",
  gap: "10px",
  minWidth: 0,
  minHeight: 0,
  overflow: "auto",
  paddingRight: "2px",
} as const;

const inlineActionPanelStyle = {
  background: "rgba(255,255,255,0.55)",
  padding: "10px 11px",
  borderRadius: 12,
  color: "#1f1a17",
} as const;

const inlineActionTitleStyle = {
  marginBottom: 6,
  fontSize: 15,
  lineHeight: 1.1,
  color: "#1f1a17",
} as const;

const inlineButtonRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 6,
} as const;

const inlineButtonStyle = {
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.18)",
  background: "rgba(255,255,255,0.74)",
  cursor: "pointer",
} as const;
