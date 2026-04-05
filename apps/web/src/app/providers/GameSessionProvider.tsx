/**
 * 功能概述：集中管理 Web 侧对局会话、回放、存档和建局设置，把页面装配与会话持久化解耦。
 * 输入输出：输入 React 子树；向下提供当前会话、派生摘要、存档列表与会话更新命令。
 * 处理流程：创建默认对局、维护 notice 与回放帧、接管存档读写，再通过 Context 暴露给页面。
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  RandomBot,
  appendReplayFrame,
  createGame,
  createReplayFrame,
  getWorkingState,
  restoreReplayFrame,
  selectCurrentPlayer,
  selectPhaseSummary,
  type EngineSession,
  type ReplayFrame,
} from "@steam/game-core";
import { getMapDefinition, getRuleSet, neUsaSeCanadaMap, ruhrMap, steamContentCatalogs } from "@steam/game-content";
import { buildDefaultPlayerNames } from "../../features/game-setup/defaultPlayerNames";
import type { GameSetupView } from "../../features/game-setup/GameSetupPanel";
import {
  deleteSavedGame,
  listSavedGames,
  loadSavedGame,
  saveGame,
  type SavedGameEntry,
} from "../../features/save-load/browserSaveRepository";

const DEFAULT_HUMAN_PLAYER_ID = "player-1";

interface ShellState {
  session: EngineSession;
  replayFrames: ReplayFrame[];
}

export interface GameSessionContextValue {
  readonly setup: GameSetupView;
  readonly session: EngineSession;
  readonly replayFrames: ReplayFrame[];
  readonly savedGames: SavedGameEntry[];
  readonly notice: string;
  readonly game: ReturnType<typeof getWorkingState>;
  readonly currentPlayer: ReturnType<typeof selectCurrentPlayer>;
  readonly phaseSummary: ReturnType<typeof selectPhaseSummary>;
  readonly humanPlayerId: string;
  readonly isHumanTurn: boolean;
  readonly bot: RandomBot;
  readonly setSetup: React.Dispatch<React.SetStateAction<GameSetupView>>;
  readonly setNotice: React.Dispatch<React.SetStateAction<string>>;
  readonly updateSession: (nextSession: EngineSession, fallback: string, recordReplay?: boolean) => void;
  readonly createNewGame: () => void;
  readonly saveCurrentGame: () => void;
  readonly loadSavedGameById: (id: string) => void;
  readonly deleteSavedGameById: (id: string) => void;
  readonly restoreReplayFrameById: (frameId: string) => void;
}

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

function createPlayableSession(setup: GameSetupView): EngineSession {
  const playerNames = buildDefaultPlayerNames(setup.playerCount, setup.nameOffset);
  const botPlayerIds = playerNames.slice(1).map((_, index) => `player-${index + 2}`);
  const map = getMapDefinition(setup.mapId);
  const ruleset = getRuleSet(setup.mode);

  if (!map || !ruleset) {
    throw new Error("默认地图或规则集不存在。");
  }

  return createGame({
    playerNames,
    botPlayerIds,
    map,
    ruleset,
    content: steamContentCatalogs,
    mapId: map.id,
    mode: ruleset.mode,
    seed: setup.seed > 0 ? setup.seed : undefined,
  });
}

function buildInitialShellState(setup: GameSetupView): ShellState {
  const session = createPlayableSession(setup);
  return {
    session,
    replayFrames: [createReplayFrame(session, "已创建新对局。")],
  };
}

function latestNotice(session: EngineSession, fallback: string): string {
  const state = getWorkingState(session);
  return state.logs[state.logs.length - 1]?.message ?? fallback;
}

/**
 * 功能：提供当前 Web 对局会话的上下文。
 * 参数：`children` 是需要访问会话状态的 React 子树。
 * 返回：包裹好 Context 的 React 节点。
 * 逻辑：统一托管建局、回放、notice 和存档，避免页面组件直接拼接基础设施逻辑。
 */
export function GameSessionProvider({ children }: { children: ReactNode }) {
  const [setup, setSetup] = useState<GameSetupView>({
    mode: "base",
    mapId: "ne-usa-se-canada",
    playerCount: 3,
    nameOffset: 0,
    seed: 0,
  });
  const [{ session, replayFrames }, setShellState] = useState(() => buildInitialShellState({
    mode: "base",
    mapId: "ne-usa-se-canada",
    playerCount: 3,
    nameOffset: 0,
    seed: 0,
  }));
  const [savedGames, setSavedGames] = useState<SavedGameEntry[]>(() => listSavedGames());
  const [notice, setNotice] = useState("当前默认由 Alice 作为真人玩家；先在行动牌面板中选牌，或直接切到标准版测试买资本和竞拍。");
  const bot = useMemo(() => new RandomBot(() => 0), []);

  const game = getWorkingState(session);
  const currentPlayer = selectCurrentPlayer(session);
  const phaseSummary = selectPhaseSummary(session);
  const humanPlayerId = game.players[session.config.humanPlayerIndex]?.id ?? DEFAULT_HUMAN_PLAYER_ID;
  const isHumanTurn = currentPlayer.id === humanPlayerId && !currentPlayer.isBot;

  function replaceSession(nextSession: EngineSession, nextFrames: ReplayFrame[], nextNotice: string) {
    setShellState({
      session: nextSession,
      replayFrames: nextFrames,
    });
    setNotice(nextNotice);
  }

  /**
   * 功能：把新的会话写回上下文，并按需要追加回放帧。
   * 参数：`nextSession` 是新会话，`fallback` 是兜底提示，`recordReplay` 控制是否写回放。
   * 返回：无。
   * 逻辑：统一计算 notice，确保页面、日志和回放时间线始终同步。
   */
  function updateSession(nextSession: EngineSession, fallback: string, recordReplay = true) {
    const nextNotice = latestNotice(nextSession, fallback);
    setShellState((current) => ({
      session: nextSession,
      replayFrames: recordReplay ? appendReplayFrame(current.replayFrames, nextSession, nextNotice) : current.replayFrames,
    }));
    setNotice(nextNotice);
  }

  /**
   * 功能：按当前设置创建一局新对局。
   * 参数：无。
   * 返回：无。
   * 逻辑：重建 shell state，并把 notice 重置为建局结果说明。
   */
  function createNewGame() {
    const nextState = buildInitialShellState(setup);
    const mapName = getMapDefinition(setup.mapId)?.name ?? setup.mapId;
    replaceSession(nextState.session, nextState.replayFrames, `已创建 ${setup.playerCount} 人 ${setup.mode} / ${mapName} 新对局。`);
  }

  /**
   * 功能：保存当前对局到浏览器本地存储。
   * 参数：无。
   * 返回：无。
   * 逻辑：生成可读标签，保存后刷新存档摘要列表。
   */
  function saveCurrentGame() {
    const label = `${game.players[0]?.name ?? "Steam"} / 第 ${game.turn.round} 回合 / ${game.turn.phase}`;
    saveGame(session, replayFrames, label);
    setSavedGames(listSavedGames());
    setNotice(`已保存本地存档：${label}。`);
  }

  /**
   * 功能：载入指定本地存档。
   * 参数：`id` 是目标存档 id。
   * 返回：无。
   * 逻辑：找不到时只更新 notice，找到后直接替换当前会话与回放时间线。
   */
  function loadSavedGameById(id: string) {
    const record = loadSavedGame(id);
    if (!record) {
      setNotice("未找到该本地存档。");
      setSavedGames(listSavedGames());
      return;
    }
    replaceSession(record.session, record.replayFrames, `已载入存档：${record.label}。`);
  }

  /**
   * 功能：删除指定存档并刷新摘要列表。
   * 参数：`id` 是目标存档 id。
   * 返回：无。
   * 逻辑：删除操作保持在 provider，页面只消费刷新后的列表。
   */
  function deleteSavedGameById(id: string) {
    setSavedGames(deleteSavedGame(id));
    setNotice("已删除该本地存档。");
  }

  /**
   * 功能：恢复到指定回放帧对应的会话快照。
   * 参数：`frameId` 是目标回放帧 id。
   * 返回：无。
   * 逻辑：从当前时间线中找帧并恢复，保持历史列表不变。
   */
  function restoreReplayFrameById(frameId: string) {
    const frame = replayFrames.find((item) => item.id === frameId);
    if (!frame) {
      setNotice("未找到该回放帧。");
      return;
    }
    setShellState({
      session: restoreReplayFrame(frame),
      replayFrames,
    });
    setNotice(`已恢复到回放帧：${frame.label}`);
  }

  const value: GameSessionContextValue = {
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
  };

  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
}

/**
 * 功能：读取当前对局上下文。
 * 参数：无。
 * 返回：当前页面共享的会话状态与命令集合。
 * 逻辑：统一在缺失 provider 时抛出错误，避免静默返回空值。
 */
export function useGameSession() {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error("useGameSession 必须在 GameSessionProvider 内使用。");
  }
  return context;
}

export const WEB_MAP_OPTIONS = [
  { id: neUsaSeCanadaMap.id, label: neUsaSeCanadaMap.name, disabled: false },
  { id: ruhrMap.id, label: `${ruhrMap.name}（数据待补完）`, disabled: ruhrMap.hexes.length === 0 },
] as const;
