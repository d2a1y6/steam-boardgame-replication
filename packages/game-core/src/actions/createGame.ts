/**
 * 功能概述：创建一局新的引擎会话。
 * 输入输出：输入玩家名单、地图与规则模式；输出包含正式状态和草稿槽位的会话对象。
 * 处理流程：接收外部注入的地图、规则集与内容目录，再复用 state 层的初始状态工厂。
 */

import type { GameContentCatalogs, GameMode, MapDefinition, RuleSet } from "../contracts/domain";
import type { EngineSession } from "../contracts/engine";
import { createInitialState } from "../state/initialState";

export interface CreateGameOptions {
  readonly playerNames: readonly string[];
  readonly botPlayerIds?: readonly string[];
  readonly map: MapDefinition;
  readonly ruleset: RuleSet;
  readonly content: GameContentCatalogs;
  readonly mapId?: string;
  readonly mode?: GameMode;
  readonly humanPlayerIndex?: number;
}

export function createGame(options: CreateGameOptions): EngineSession {
  const mapId = options.mapId ?? options.map.id;
  const mode = options.mode ?? options.ruleset.mode;
  const playerCount = options.playerNames.length;
  const inferredHumanPlayerIndex = [...options.playerNames].findIndex(
    (_, index) => ![...(options.botPlayerIds ?? [])].includes(`player-${index + 1}`),
  );
  const humanPlayerIndex = options.humanPlayerIndex ?? (inferredHumanPlayerIndex >= 0 ? inferredHumanPlayerIndex : 0);

  return {
    committed: createInitialState({
      playerNames: [...options.playerNames],
      botPlayerIds: [...(options.botPlayerIds ?? [])],
      map: options.map,
      ruleset: options.ruleset,
      content: options.content,
    }),
    draft: null,
    config: {
      mode,
      mapId,
      playerCount,
      humanPlayerIndex,
    },
    actionHistory: [],
  };
}
