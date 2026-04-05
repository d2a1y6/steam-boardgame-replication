/**
 * 功能概述：把规则引擎会话接到第三部分的设置、解释、存档和回放型主壳上。
 * 输入输出：不接收外部参数；输出一个本地可操作、可保存、可回放的基础版页面。
 * 处理流程：读取 provider 中的当前会话、整理派生查询、驱动地图与面板交互，再调用命令 hook 推进状态。
 */

import { useEffect, useState } from "react";
import {
  getBuildableHexIds,
  getDeliveryPreview,
  getMovableGoodsSources,
  getRankedDeliveryCandidatesForSource,
  getRuleExplanation,
  getTilePoolSummary,
  getTrackPaletteOptions,
  getTrackPlacementOptions,
  getTrackPlacementPreview,
  getTurnOrderEntries,
  type ActionTileId,
} from "@steam/game-core";
import { useGameSession } from "../../app/providers/GameSessionProvider";
import { GameSetupPanel } from "../../features/game-setup/GameSetupPanel";
import { ActionTilePanel } from "../../features/session-control/ActionTilePanel";
import { PhasePanel, type PhaseControl } from "../../features/session-control/PhasePanel";
import { TurnOrderPanel } from "../../features/session-control/TurnOrderPanel";
import { useSessionCommands } from "../../features/session-control/useSessionCommands";
import { MapBoard } from "../../features/board/MapBoard";
import { TrackPalettePanel } from "../../features/board/TrackPalettePanel";
import { TrackPlacementPanel } from "../../features/board/TrackPlacementPanel";
import { DeliveryCandidatePanel } from "../../features/delivery/DeliveryCandidatePanel";
import { DeliveryPreview } from "../../features/delivery/DeliveryPreview";
import { DeliverySourcePanel } from "../../features/delivery/DeliverySourcePanel";
import { PlayerPanel } from "../../features/players/PlayerPanel";
import { ActionHistoryPanel } from "../../features/logs/ActionHistoryPanel";
import { LogPanel } from "../../features/logs/LogPanel";
import { IllegalMoveNotice } from "../../features/rule-help/IllegalMoveNotice";
import { RuleExplanationPanel } from "../../features/rule-help/RuleExplanationPanel";
import { ReplayPanel } from "../../features/replay/ReplayPanel";
import { GoodsSupplyPanel } from "../../features/supply/GoodsSupplyPanel";
import { TilePoolPanel } from "../../features/supply/TilePoolPanel";
import { SaveLoadPanel } from "../../features/save-load/SaveLoadPanel";

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
 * 功能：渲染第三部分主页面。
 * 参数：无。
 * 返回：一个本地可操作、可解释、可保存和可回放的基础版原型页面。
 * 逻辑：在第二部分主路径上增加设置入口、结构化规则解释、本地存档与回放时间线。
 */
export function GamePage() {
  const {
    setup,
    session,
    replayFrames,
    savedGames,
    notice,
    game,
    currentPlayer,
    phaseSummary,
    humanPlayerId,
    isHumanTurn,
    bot,
    setSetup,
    setNotice,
    updateSession,
    createNewGame,
    saveCurrentGame,
    loadSavedGameById,
    deleteSavedGameById,
    restoreReplayFrameById,
  } = useGameSession();
  const [selectedTrackTileId, setSelectedTrackTileId] = useState<string | null>("21");
  const [selectedBuildHexId, setSelectedBuildHexId] = useState<string | null>(null);
  const [selectedRotation, setSelectedRotation] = useState<number | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const commands = useSessionCommands({
    session,
    currentPlayerId: currentPlayer.id,
    humanPlayerId,
    phase: game.turn.phase,
    bot,
    updateSession,
  });

  useEffect(() => {
    setSelectedBuildHexId(null);
    setSelectedRotation(null);
    setSelectedSourceId(null);
    setSelectedCandidateId(null);
  }, [game.turn.phase, currentPlayer.id]);

  const actionTiles = session.committed.content.actionTiles.map((tile) => {
    const selectedByEntry = Object.entries(game.turn.selectedActionTiles).find(([, selected]) => selected === tile.id);
    return {
      tileId: tile.id,
      label: tile.label,
      value: tile.value,
      disabled: Boolean(selectedByEntry),
      selectedByPlayerId: selectedByEntry?.[0] ?? null,
    };
  });
  const trackPalette = getTrackPaletteOptions(session);
  const tilePoolSummary = getTilePoolSummary(session);
  const turnOrderEntries = getTurnOrderEntries(session);
  const movableSources = isHumanTurn ? getMovableGoodsSources(session, humanPlayerId) : [];

  const buildableHexIds =
    isHumanTurn && game.turn.phase === "build-track" && selectedTrackTileId
      ? getBuildableHexIds(session, humanPlayerId, selectedTrackTileId)
      : [];

  const placementOptions =
    isHumanTurn && game.turn.phase === "build-track" && selectedTrackTileId && selectedBuildHexId
      ? getTrackPlacementOptions(session, humanPlayerId, selectedTrackTileId, selectedBuildHexId)
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
      ? getTrackPlacementPreview(session, humanPlayerId, selectedTrackTileId, selectedBuildHexId, effectiveRotation)
      : null;

  const sourceKey = parseSourceKey(selectedSourceId);
  const rankedCandidates =
    isHumanTurn && sourceKey
      ? getRankedDeliveryCandidatesForSource(session, humanPlayerId, sourceKey.sourceHexId, sourceKey.goodsColor)
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

  const explanation = getRuleExplanation({
    session,
    isHumanTurn,
    notice,
    trackPreview,
    selectedCandidate,
  });

  function handleCreateNewGame() {
    createNewGame();
    setSelectedTrackTileId("21");
  }

  function handleSaveCurrentGame() {
    saveCurrentGame();
  }

  function handleLoadSavedGame(id: string) {
    loadSavedGameById(id);
  }

  function handleDeleteSavedGame(id: string) {
    deleteSavedGameById(id);
  }

  function handleRestoreReplay(frameId: string) {
    restoreReplayFrameById(frameId);
  }

  function handleSelectActionTile(tileId: string) {
    commands.selectActionTile(tileId as ActionTileId);
  }

  function handleConfirmTrack() {
    if (!selectedTrackTileId || !selectedBuildHexId || effectiveRotation == null) {
      setNotice("先选轨道板、hex 和朝向。");
      return;
    }

    commands.placeTrack(selectedBuildHexId, selectedTrackTileId, effectiveRotation);
    setSelectedBuildHexId(null);
    setSelectedRotation(null);
  }

  function handleFinishBuild() {
    commands.finishBuild();
  }

  function handleResetBuild() {
    if (!session.draft) {
      setNotice("当前没有草稿可重置。");
      return;
    }
    commands.resetBuild();
  }

  function handleCommitDraft() {
    if (!session.draft) {
      setNotice("当前没有草稿可提交。");
      return;
    }
    commands.commitBuildDraft();
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
    commands.deliverGoods(selectedCandidate);
  }

  function handleUpgradeLocomotive() {
    commands.upgradeLocomotive();
  }

  function handlePassMove() {
    commands.passMove();
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
      onClick: commands.advanceBotsUntilHuman,
    },
    {
      id: "debug-step",
      label: "调试：自动一步",
      onClick: commands.debugStep,
    },
    {
      id: "debug-many",
      label: "调试：自动十步",
      onClick: commands.debugMany,
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
          <div style={eyebrowStyle}>Steam / 第三部分工作壳</div>
          <h1 style={titleStyle}>Steam 规则学习壳</h1>
          <p style={subtitleStyle}>当前页面已加入新对局设置、结构化规则解释、本地存档、回放时间线和显式动作历史。</p>
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
          <GameSetupPanel
            setup={setup}
            onPlayerCountChange={(playerCount) => setSetup((current) => ({ ...current, playerCount }))}
            onNameOffsetChange={(nameOffset) => setSetup((current) => ({ ...current, nameOffset }))}
            onCreate={handleCreateNewGame}
          />
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
          <RuleExplanationPanel explanation={explanation} />

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
                <button style={inlineButtonStyle} type="button" onClick={commands.resolveCurrentPhase}>
                  执行当前阶段
                </button>
              </div>
            </section>
          ) : null}
        </aside>

        <aside style={infoColumnStyle}>
          <SaveLoadPanel
            saves={savedGames}
            onSave={handleSaveCurrentGame}
            onLoad={handleLoadSavedGame}
            onDelete={handleDeleteSavedGame}
          />
          <ReplayPanel frames={replayFrames} onRestore={handleRestoreReplay} />
          <ActionHistoryPanel items={session.actionHistory} />
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
  maxWidth: "1700px",
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
  gridTemplateColumns: "minmax(0, 1.15fr) minmax(360px, 450px) minmax(320px, 380px)",
  gap: "12px",
  alignItems: "stretch",
  minHeight: "calc(100vh - 86px)",
  maxWidth: "1700px",
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
  gridAutoRows: "max-content",
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
