import { describe, expect, it } from "vitest";
import { RandomBot } from "../src/bot/RandomBot";
import { runBotStep } from "../src/bot/botTurn";
import type { Bot } from "../src/bot/Bot";
import { createInitialState } from "../src/state/initialState";
import { neUsaSeCanadaMap } from "../src/data/maps/ne_usa_se_canada";

describe("bot", () => {
  it("RandomBot 会在行动牌阶段返回一条合法动作", () => {
    const game = createInitialState({ playerNames: ["Ada", "Babbage", "Curie"], map: neUsaSeCanadaMap });
    const bot = new RandomBot(() => 0);
    const move = bot.getMove(game, game.players[0].id);

    expect(move?.type).toBe("select-action-tile");
    if (move?.type === "select-action-tile") {
      expect(move.playerId).toBe(game.players[0].id);
    }
  });

  it("runBotStep 在 Bot 没有动作时保持会话不变", () => {
    const game = createInitialState({ playerNames: ["Ada", "Babbage", "Curie"], map: neUsaSeCanadaMap });
    const session = { committed: game, draft: null };
    const idleBot: Bot = { getMove: () => null };

    expect(runBotStep(session, idleBot, game.players[0].id)).toBe(session);
  });
});
