import { describe, expect, it } from "vitest";
import { RandomBot, runBotStep, type Bot } from "@steam/game-core";
import { baseRuleSet, neUsaSeCanadaMap, steamContentCatalogs } from "@steam/game-content";
import { createInitialState } from "../../src/state/initialState";

describe("bot", () => {
  it("RandomBot 会在行动牌阶段返回一条合法动作", () => {
    const game = createInitialState({
      playerNames: ["Ada", "Babbage", "Curie"],
      map: neUsaSeCanadaMap,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
    });
    const bot = new RandomBot(() => 0);
    const move = bot.getMove(game, game.players[0].id);

    expect(move?.type).toBe("select-action-tile");
    if (move?.type === "select-action-tile") {
      expect(move.playerId).toBe(game.players[0].id);
    }
  });

  it("runBotStep 在 Bot 没有动作时保持会话不变", () => {
    const game = createInitialState({
      playerNames: ["Ada", "Babbage", "Curie"],
      map: neUsaSeCanadaMap,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
    });
    const session = {
      committed: game,
      draft: null,
      config: {
        mode: "base" as const,
        mapId: "ne-usa-se-canada" as const,
        playerCount: 3,
        humanPlayerIndex: 0,
      },
      actionHistory: [],
    };
    const idleBot: Bot = { getMove: () => null };

    expect(runBotStep(session, idleBot, game.players[0].id)).toBe(session);
  });
});
