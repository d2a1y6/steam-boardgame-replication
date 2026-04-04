/**
 * 功能概述：把规则引擎会话接到最薄的一层浏览器演示壳上。
 * 输入输出：不接收外部参数；输出一局可在本地页面里推进的演示局面。
 * 处理流程：创建引擎会话、读取当前工作态、提供自动推进与草稿控制按钮，再渲染地图和日志。
 */

import { useState } from "react";
import { RandomBot } from "../bot/RandomBot";
import { runBotStep } from "../bot/botTurn";
import { createGame } from "../engine/createGame";
import { commitDraft, getWorkingState, resetDraft } from "../engine/draftSession";
import { selectCurrentPlayer, selectPhaseSummary } from "../engine/selectors";
import type { EngineSession } from "../engine/types";
import { LogPanel } from "./LogPanel";
import { MapBoard } from "./MapBoard";
import { PhasePanel } from "./PhasePanel";
import { PlayerPanel } from "./PlayerPanel";
import { RuleHintPanel } from "./RuleHintPanel";

function createDemoSession(): EngineSession {
  return createGame({
    playerNames: ["Ada", "Babbage", "Curie"],
    botPlayerIds: ["player-1", "player-2", "player-3"],
    mapId: "ne-usa-se-canada",
    mode: "base",
  });
}

function describeHint(session: EngineSession): string {
  const state = getWorkingState(session);
  if (session.draft) {
    return "当前正处于阶段草稿中。你可以继续点“自动执行一步”，或者用“提交草稿”“重置阶段”观察草稿机制。";
  }
  if (state.turn.phase === "select-action") {
    return "先连续点“自动执行一步”几次，观察玩家依次选择行动牌，然后系统进入建轨阶段。";
  }
  if (state.turn.phase === "build-track") {
    return "建轨阶段会先写进草稿层。多点几次“自动执行一步”，再看日志、地图上的轨数量和“提交草稿”按钮。";
  }
  if (state.turn.phase === "move-goods-round-1" || state.turn.phase === "move-goods-round-2") {
    return "运输阶段目前主要用于验证状态机会继续推进。货物路径与分数逻辑还只是第一部分的最小实现。";
  }
  if (state.turn.phase === "income" || state.turn.phase === "determine-order" || state.turn.phase === "set-up-next-turn") {
    return "继续点“自动执行一步”即可看到收入、顺位确认和下一回合准备。";
  }
  return "这是第一部分骨架，重点是看状态如何推进，而不是完成最终可玩版本。";
}

function latestNotice(session: EngineSession, fallback: string): string {
  const state = getWorkingState(session);
  return state.logs[state.logs.length - 1]?.message ?? fallback;
}

/**
 * 功能：渲染本地开发页的游戏主壳。
 * 参数：无。
 * 返回：一个可在本地 URL 中启动、查看和推进演示局面的页面节点。
 * 逻辑：把当前行动玩家临时交给 RandomBot 执行一步，用最少交互验证状态树、阶段机和日志是否同步变化。
 */
export function GameShell() {
  const [session, setSession] = useState<EngineSession>(() => createDemoSession());
  const [notice, setNotice] = useState("点“自动执行一步”开始推进演示局。");
  const bot = new RandomBot();

  const game = getWorkingState(session);
  const currentPlayer = selectCurrentPlayer(session);
  const phaseSummary = selectPhaseSummary(session);

  function handleStep() {
    const nextSession = runBotStep(session, bot, currentPlayer.id);
    setSession(nextSession);
    setNotice(latestNotice(nextSession, "已执行一步。"));
  }

  function handlePlayMany() {
    let nextSession = session;
    for (let step = 0; step < 10; step += 1) {
      const activePlayer = selectCurrentPlayer(nextSession);
      nextSession = runBotStep(nextSession, bot, activePlayer.id);
    }
    setSession(nextSession);
    setNotice(latestNotice(nextSession, "已自动推进十步。"));
  }

  function handleCommit() {
    if (!session.draft) {
      setNotice("当前没有草稿可提交。");
      return;
    }
    const nextSession = commitDraft(session);
    setSession(nextSession);
    setNotice("已提交当前阶段草稿。继续点“自动执行一步”可让系统进入后续动作。");
  }

  function handleReset() {
    if (!session.draft) {
      setNotice("当前没有草稿可重置。");
      return;
    }
    const nextSession = resetDraft(session);
    setSession(nextSession);
    setNotice("已回到本阶段起点。");
  }

  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Steam / 第一部分骨架</div>
          <h1 style={titleStyle}>Steam 规则学习壳</h1>
          <p style={subtitleStyle}>本地浏览器演示页；用自动推进来检查阶段机、草稿层、地图状态和日志。</p>
        </div>
        <div style={statusStyle}>{phaseSummary.phaseLabel}</div>
      </header>

      <main style={mainStyle}>
        <section style={boardColumnStyle}>
          <MapBoard game={game} />
        </section>

        <aside style={sideColumnStyle}>
          <PhasePanel
            summary={{
              currentPlayer,
              phase: phaseSummary.phaseLabel,
              round: game.turn.round,
              actionLabel: phaseSummary.actionLabel,
            }}
            notice={notice}
            onStep={handleStep}
            onPlayMany={handlePlayMany}
            onCommit={handleCommit}
            onReset={handleReset}
          />
          <PlayerPanel players={game.players} currentPlayerId={currentPlayer?.id ?? null} />
          <RuleHintPanel text={describeHint(session)} />
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
  maxWidth: "1500px",
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
  gridTemplateColumns: "minmax(0, 1fr) minmax(340px, 400px)",
  gap: "12px",
  alignItems: "stretch",
  minHeight: "calc(100vh - 86px)",
  maxWidth: "1500px",
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

const sideColumnStyle = {
  display: "grid",
  gridTemplateRows: "auto auto auto minmax(0, 1fr)",
  gap: "10px",
  minWidth: 0,
  minHeight: 0,
} as const;
