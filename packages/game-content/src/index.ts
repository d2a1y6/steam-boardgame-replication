import type { GameContentCatalogs, GameMode, MapDefinition, RuleSet } from "@steam/game-core";
import { neUsaSeCanadaMap } from "./maps/ne_usa_se_canada";
import { ruhrMap } from "./maps/ruhr";
import { baseRuleSet } from "./rulesets/base";
import { standardRuleSet } from "./rulesets/standard";
import { ACTION_TILE_DEFINITIONS } from "./setup/actionTiles";
import { GOODS_BAG_COMPOSITION, GOODS_SUPPLY_CUBES_PER_SPACE, GOODS_SUPPLY_SPACE_COUNT } from "./setup/goods";
import { NEW_CITY_TILE_COLORS } from "./setup/newCities";
import { TILE_MANIFEST } from "./tiles/manifest";

export { neUsaSeCanadaMap, ruhrMap, baseRuleSet, standardRuleSet, ACTION_TILE_DEFINITIONS, GOODS_BAG_COMPOSITION, GOODS_SUPPLY_CUBES_PER_SPACE, GOODS_SUPPLY_SPACE_COUNT, NEW_CITY_TILE_COLORS, TILE_MANIFEST };

export const steamContentCatalogs: GameContentCatalogs = {
  actionTiles: ACTION_TILE_DEFINITIONS,
  tileManifest: TILE_MANIFEST,
  goodsBagComposition: GOODS_BAG_COMPOSITION,
  goodsSupplySpaceCount: GOODS_SUPPLY_SPACE_COUNT,
  goodsSupplyCubesPerSpace: GOODS_SUPPLY_CUBES_PER_SPACE,
  newCityTiles: NEW_CITY_TILE_COLORS,
};

const MAP_REGISTRY: Record<string, MapDefinition> = {
  [neUsaSeCanadaMap.id]: neUsaSeCanadaMap,
  [ruhrMap.id]: ruhrMap,
};

const RULESET_REGISTRY: Record<GameMode, RuleSet> = {
  base: baseRuleSet,
  standard: standardRuleSet,
};

export function getMapDefinition(mapId: string) {
  return MAP_REGISTRY[mapId];
}

export function getRuleSet(mode: GameMode) {
  return RULESET_REGISTRY[mode];
}
