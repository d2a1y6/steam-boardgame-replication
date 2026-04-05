import { describe, expect, it } from "vitest";
import { applyAction, createGame } from "@steam/game-core";
import { baseRuleSet, getMapDefinition, steamContentCatalogs } from "@steam/game-content";

describe("cityActions", () => {
  it("会在建轨阶段执行 City Growth，并放置 marker 与整组 supply cubes", () => {
    const map = getMapDefinition("ne-usa-se-canada");
    if (!map) {
      throw new Error("测试地图不存在。");
    }

    const session = createGame({
      playerNames: ["Alice", "Bob", "Carol"],
      botPlayerIds: ["player-2", "player-3"],
      map,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
      mapId: map.id,
      mode: "base",
    });

    session.committed.turn.phase = "build-track";
    session.committed.turn.buildOrder = ["player-1", "player-2", "player-3"];
    session.committed.turn.currentPlayerIndex = 0;
    session.committed.turn.pendingBuildActions = {
      "player-1": "city-growth",
      "player-2": null,
      "player-3": null,
    };
    session.committed.supply.goodsSupply = [
      { id: "supply-1", cubes: ["red", "blue"] },
      { id: "supply-2", cubes: ["yellow"] },
    ];

    const nextSession = applyAction(session, {
      type: "perform-city-growth",
      playerId: "player-1",
      cityHexId: "albany",
      supplyGroupId: "supply-1",
    });

    expect(nextSession.committed.map.cityGrowthMarkers).toContain("albany");
    expect(nextSession.committed.map.cityGoods["albany"]?.slice(-2)).toEqual(["red", "blue"]);
    expect(nextSession.committed.supply.goodsSupply).toHaveLength(1);
    expect(nextSession.committed.turn.pendingBuildActions?.["player-1"]).toBeNull();
  });

  it("会把 town 升级成新城市，并移除原本的 town track", () => {
    const map = getMapDefinition("ne-usa-se-canada");
    if (!map) {
      throw new Error("测试地图不存在。");
    }

    const session = createGame({
      playerNames: ["Alice", "Bob", "Carol"],
      botPlayerIds: ["player-2", "player-3"],
      map,
      ruleset: baseRuleSet,
      content: steamContentCatalogs,
      mapId: map.id,
      mode: "base",
    });

    session.committed.turn.phase = "build-track";
    session.committed.turn.buildOrder = ["player-1", "player-2", "player-3"];
    session.committed.turn.currentPlayerIndex = 0;
    session.committed.turn.pendingBuildActions = {
      "player-1": "urbanization",
      "player-2": null,
      "player-3": null,
    };
    session.committed.supply.goodsSupply = [{ id: "supply-1", cubes: ["gray", "yellow"] }];
    session.committed.map.trackPieces = [
      {
        id: "track-1",
        hexId: "poughkeepsie",
        tileId: "T11",
        ownerId: "player-1",
        rotation: 0,
      },
    ];

    const nextSession = applyAction(session, {
      type: "perform-urbanization",
      playerId: "player-1",
      townHexId: "poughkeepsie",
      newCityColor: "purple",
      supplyGroupId: "supply-1",
    });

    const upgradedHex = nextSession.committed.map.definition.hexes.find((hex) => hex.id === "poughkeepsie");
    expect(upgradedHex?.terrain).toBe("city");
    expect(upgradedHex?.isTown).toBe(false);
    expect(upgradedHex?.cityColor).toBe("purple");
    expect(nextSession.committed.map.cityGrowthMarkers).toContain("poughkeepsie");
    expect(nextSession.committed.map.cityGoods["poughkeepsie"]).toEqual(["gray", "yellow"]);
    expect(nextSession.committed.map.trackPieces).toHaveLength(0);
    expect(nextSession.committed.supply.tilePool.counts.T11).toBe(5);
    expect(nextSession.committed.turn.pendingBuildActions?.["player-1"]).toBeNull();
  });
});
