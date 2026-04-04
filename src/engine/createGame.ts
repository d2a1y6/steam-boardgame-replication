/**
 * 功能概述：创建一局新的引擎会话。
 * 输入输出：输入玩家名单、地图与规则模式；输出包含正式状态和草稿槽位的会话对象。
 * 处理流程：解析 mapId，挑选规则集，再复用 state 层的初始状态工厂。
 */

import { neUsaSeCanadaMap, type MapDefinition } from "../data/maps/ne_usa_se_canada";
import { ruhrMap } from "../data/maps/ruhr";
import { baseRuleSet, type RuleSet } from "../rulesets/base";
import { standardRuleSet } from "../rulesets/standard";
import { createInitialState } from "../state/initialState";
import type { EngineSession } from "./types";

export interface CreateGameOptions {
  readonly playerNames: readonly string[];
  readonly botPlayerIds?: readonly string[];
  readonly map?: MapDefinition;
  readonly mapId?: "ne-usa-se-canada" | "ruhr";
  readonly mode?: "base" | "standard";
  readonly ruleset?: RuleSet;
}

const MAP_REGISTRY: Record<NonNullable<CreateGameOptions["mapId"]>, MapDefinition> = {
  "ne-usa-se-canada": neUsaSeCanadaMap,
  ruhr: ruhrMap,
};

function resolveMap(options: CreateGameOptions): MapDefinition {
  if (options.map) {
    return options.map;
  }
  return MAP_REGISTRY[options.mapId ?? "ne-usa-se-canada"];
}

function resolveRuleset(options: CreateGameOptions): RuleSet {
  if (options.ruleset) {
    return options.ruleset;
  }
  return options.mode === "standard" ? standardRuleSet : baseRuleSet;
}

export function createGame(options: CreateGameOptions): EngineSession {
  return {
    committed: createInitialState({
      playerNames: [...options.playerNames],
      botPlayerIds: [...(options.botPlayerIds ?? [])],
      map: resolveMap(options),
      ruleset: resolveRuleset(options),
    }),
    draft: null,
  };
}
